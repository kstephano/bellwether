import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";
import { createDbClient, type DbClient } from "@/lib/db/client";
import { categories, researchRuns, reports, auditLog, stackEntries } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { ReportSections, ResearchClients } from "@/lib/research/types";

const TEST_USER = "test-user-pipeline";
const skipIfNoDb = !process.env.TEST_DATABASE_URL;

const mockSections: ReportSections = {
  changeDigest: { items: [{ description: "v2.0.0 released" }] },
  currentState: { summary: "Stable and widely adopted", gotchas: ["SSR hydration"] },
  strategicOutlook: { risks: ["Bundle size"], opportunities: ["Server Components"] },
  securityAdvisories: { advisories: [{ id: "CVE-2024-001", summary: "XSS in props" }] },
};

function makeMockClients(overrides: Partial<ResearchClients> = {}): ResearchClients {
  return {
    fetchCurated: vi.fn().mockResolvedValue("curated content"),
    fetchUserSources: vi.fn().mockResolvedValue([]),
    search: vi.fn().mockResolvedValue("search results"),
    synthesise: vi.fn().mockResolvedValue(mockSections),
    log: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe.skipIf(skipIfNoDb)("Research Run pipeline", () => {
  let db: DbClient;
  let defaultCategoryId: string;

  beforeAll(async () => {
    db = createDbClient(process.env.TEST_DATABASE_URL!);
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.isDefault, true))
      .limit(1);
    if (!cat) throw new Error("No default categories — run migrations and seed");
    defaultCategoryId = cat.id;
  });

  afterEach(async () => {
    const runs = await db
      .select({ id: researchRuns.id })
      .from(researchRuns)
      .where(eq(researchRuns.userId, TEST_USER));
    const runIds = runs.map((r) => r.id);
    if (runIds.length) {
      await db.delete(auditLog).where(inArray(auditLog.researchRunId, runIds));
      await db.delete(reports).where(inArray(reports.researchRunId, runIds));
    }
    await db.delete(researchRuns).where(eq(researchRuns.userId, TEST_USER));
    await db.delete(stackEntries).where(eq(stackEntries.userId, TEST_USER));
  });

  it("produces a Report with all four sections having non-empty content", async () => {
    const { runResearchPipeline } = await import("@/lib/research/pipeline");

    const [run] = await db
      .insert(researchRuns)
      .values({ userId: TEST_USER, triggeredBy: "MANUAL" })
      .returning();

    const [entry] = await db
      .insert(stackEntries)
      .values({ userId: TEST_USER, categoryId: defaultCategoryId, technology: "React" })
      .returning();

    await runResearchPipeline(db, run.id, entry, "STACK_ENTRY", makeMockClients());

    const [report] = await db
      .select()
      .from(reports)
      .where(eq(reports.researchRunId, run.id));

    expect(report).toBeDefined();
    const cd = report.changeDigest as ReportSections["changeDigest"];
    const cs = report.currentState as ReportSections["currentState"];
    const so = report.strategicOutlook as ReportSections["strategicOutlook"];
    const sa = report.securityAdvisories as ReportSections["securityAdvisories"];
    expect(cd.items.length).toBeGreaterThan(0);
    expect(cs.summary.length).toBeGreaterThan(0);
    expect(so.risks.length + so.opportunities.length).toBeGreaterThan(0);
    expect(sa.advisories.length).toBeGreaterThan(0);
  });

  it("includes a Delta Section when a previous Report exists for the same target", async () => {
    const { runResearchPipeline } = await import("@/lib/research/pipeline");

    const [run1] = await db
      .insert(researchRuns)
      .values({ userId: TEST_USER, triggeredBy: "MANUAL" })
      .returning();
    const [run2] = await db
      .insert(researchRuns)
      .values({ userId: TEST_USER, triggeredBy: "MANUAL" })
      .returning();
    const [entry] = await db
      .insert(stackEntries)
      .values({ userId: TEST_USER, categoryId: defaultCategoryId, technology: "React" })
      .returning();

    await runResearchPipeline(db, run1.id, entry, "STACK_ENTRY", makeMockClients());

    const secondSections: ReportSections = {
      ...mockSections,
      securityAdvisories: {
        advisories: [
          { id: "CVE-2024-001", summary: "XSS in props" },
          { id: "CVE-2024-999", summary: "New critical vuln" },
        ],
      },
    };
    await runResearchPipeline(db, run2.id, entry, "STACK_ENTRY",
      makeMockClients({ synthesise: vi.fn().mockResolvedValue(secondSections) })
    );

    const [secondReport] = await db
      .select()
      .from(reports)
      .where(eq(reports.researchRunId, run2.id));

    expect(secondReport.deltaSection).not.toBeNull();
  });

  it("logs audit entries for Tavily and Anthropic calls", async () => {
    const { runResearchPipeline } = await import("@/lib/research/pipeline");

    const [run] = await db
      .insert(researchRuns)
      .values({ userId: TEST_USER, triggeredBy: "MANUAL" })
      .returning();
    const [entry] = await db
      .insert(stackEntries)
      .values({ userId: TEST_USER, categoryId: defaultCategoryId, technology: "React" })
      .returning();

    const logSpy = vi.fn().mockResolvedValue(undefined);
    await runResearchPipeline(db, run.id, entry, "STACK_ENTRY",
      makeMockClients({ log: logSpy })
    );

    const tavilyCall = logSpy.mock.calls.find(([svc]) => svc === "TAVILY");
    const anthropicCall = logSpy.mock.calls.find(([svc]) => svc === "ANTHROPIC");
    expect(tavilyCall).toBeDefined();
    expect(anthropicCall).toBeDefined();
    expect(typeof tavilyCall?.[1]).toBe("number");
    expect(typeof anthropicCall?.[1]).toBe("number");
  });

  it("retains partial Reports when a pipeline step fails for a later target", async () => {
    const { runResearchPipeline } = await import("@/lib/research/pipeline");

    const [run] = await db
      .insert(researchRuns)
      .values({ userId: TEST_USER, triggeredBy: "MANUAL" })
      .returning();
    const [entryA] = await db
      .insert(stackEntries)
      .values({ userId: TEST_USER, categoryId: defaultCategoryId, technology: "React" })
      .returning();
    const [entryB] = await db
      .insert(stackEntries)
      .values({ userId: TEST_USER, categoryId: defaultCategoryId, technology: "Vue" })
      .returning();

    // First target succeeds
    await runResearchPipeline(db, run.id, entryA, "STACK_ENTRY", makeMockClients());

    // Second target fails
    await expect(
      runResearchPipeline(db, run.id, entryB, "STACK_ENTRY",
        makeMockClients({ synthesise: vi.fn().mockRejectedValue(new Error("API timeout")) })
      )
    ).rejects.toThrow("API timeout");

    // Report for first target is retained
    const persistedReports = await db
      .select()
      .from(reports)
      .where(eq(reports.researchRunId, run.id));

    expect(persistedReports).toHaveLength(1);
    expect(persistedReports[0].targetId).toBe(entryA.id);
  });
});
