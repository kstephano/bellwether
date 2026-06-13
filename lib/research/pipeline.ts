import { eq, and } from "drizzle-orm";
import type { DbClient } from "@/lib/db/client";
import { reports, researchRuns, auditLog, sources } from "@/lib/db/schema";
import { computeDeltaSection } from "./delta";
import type { ResearchClients, ReportSections } from "./types";

type Target = { id: string; technology?: string; text?: string; version?: string | null };
type TargetType = "STACK_ENTRY" | "FREE_TEXT_TOPIC";

export async function runResearchPipeline(
  db: DbClient,
  researchRunId: string,
  target: Target,
  targetType: TargetType,
  clients: ResearchClients
): Promise<void> {
  const technology = target.technology ?? target.text ?? "unknown";

  // 1. Fetch curated sources
  const curated = await clients.fetchCurated(technology, target.version);

  // 2. Fetch user-defined sources
  const userSourceRows = await db
    .select()
    .from(sources)
    .where(and(eq(sources.targetId, target.id), eq(sources.targetType, targetType)));
  const userContent = await clients.fetchUserSources(userSourceRows.map((s) => s.url));

  // 3. Web search via Tavily
  const searchResults = await clients.search(`${technology} latest updates`);
  await clients.log("TAVILY", searchResults.length);

  // 4. Synthesise via Claude
  const raw = [curated, ...userContent, searchResults].join("\n\n");
  const sections: ReportSections = await clients.synthesise(raw);
  await clients.log("ANTHROPIC", raw.length);

  // 5. Compute Delta Section against most recent previous Report
  const [previousReport] = await db
    .select()
    .from(reports)
    .where(and(eq(reports.targetId, target.id), eq(reports.targetType, targetType)))
    .orderBy(reports.createdAt)
    .limit(1);

  const previousSections = previousReport
    ? (previousReport as { changeDigest: ReportSections["changeDigest"]; currentState: ReportSections["currentState"]; strategicOutlook: ReportSections["strategicOutlook"]; securityAdvisories: ReportSections["securityAdvisories"] })
    : null;

  const deltaSection = previousSections
    ? computeDeltaSection(sections, previousSections as ReportSections)
    : null;

  // 6. Persist Report
  await db.insert(reports).values({
    researchRunId,
    targetId: target.id,
    targetType,
    deltaSection,
    changeDigest: sections.changeDigest,
    currentState: sections.currentState,
    strategicOutlook: sections.strategicOutlook,
    securityAdvisories: sections.securityAdvisories,
  });
}
