import Link from "next/link";
import { getDb } from "@/lib/db/client";
import {
  getLatestCompletedRun,
  getTargetForUser,
  listReportsForRun,
} from "@/lib/db/repository";
import type { DeltaSection } from "@/lib/research/types";
import { deltaSummary } from "./reports/delta-summary";
import {
  formatReportDate,
  segmentFromTargetType,
} from "./reports/target-type";

type Highlight = {
  reportId: string;
  targetId: string;
  targetType: "STACK_ENTRY" | "FREE_TEXT_TOPIC";
  targetName: string;
  delta: DeltaSection | null;
};

function ledeSentence(highlights: Highlight[]): string {
  const newAdvisories = highlights.reduce(
    (sum, h) => sum + (h.delta?.newAdvisories.length ?? 0),
    0
  );
  const resolved = highlights.reduce(
    (sum, h) => sum + (h.delta?.resolvedAdvisories.length ?? 0),
    0
  );
  const newChanges = highlights.reduce(
    (sum, h) => sum + (h.delta?.newChanges.length ?? 0),
    0
  );
  const firstReports = highlights.filter((h) => !h.delta).length;

  const parts: string[] = [];
  if (newAdvisories > 0) {
    parts.push(
      `${newAdvisories} new Security ${newAdvisories === 1 ? "Advisory" : "Advisories"}`
    );
  }
  if (resolved > 0) parts.push(`${resolved} resolved`);
  if (newChanges > 0) {
    parts.push(`${newChanges} new ${newChanges === 1 ? "change" : "changes"}`);
  }
  if (parts.length === 0) {
    return firstReports === highlights.length
      ? `First Reports for ${highlights.length === 1 ? "your target" : `all ${highlights.length} targets`} — no Delta to compare yet.`
      : "A quiet month across your stack: nothing new since the previous Reports.";
  }
  const scope = `across ${highlights.length} ${highlights.length === 1 ? "target" : "targets"} this month.`;
  return `${parts.join(", ")} ${scope}`;
}

export async function DeltaDigest({ userId }: { userId: string }) {
  const db = getDb();
  const run = await getLatestCompletedRun(db, userId);
  const runReports = run ? await listReportsForRun(db, run.id) : [];

  // Resolve target names, dropping Reports whose target has since been
  // deleted (they are no longer reachable from the Stack, per ADR-0002
  // ownership checks).
  const highlights = (
    await Promise.all(
      runReports.map(async (report): Promise<Highlight | null> => {
        const target = await getTargetForUser(
          db,
          report.targetId,
          report.targetType,
          userId
        );
        if (!target) return null;
        return {
          reportId: report.id,
          targetId: report.targetId,
          targetType: report.targetType,
          targetName: target.name,
          delta: report.deltaSection as DeltaSection | null,
        };
      })
    )
  )
    .filter((h): h is Highlight => h !== null)
    .sort(
      (a, b) =>
        (b.delta?.newAdvisories.length ?? 0) - (a.delta?.newAdvisories.length ?? 0) ||
        (b.delta?.newChanges.length ?? 0) - (a.delta?.newChanges.length ?? 0)
    );

  return (
    <section aria-labelledby="delta-digest-heading">
      <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2">
        <h2 id="delta-digest-heading" className="kicker text-foreground">
          Delta Digest
        </h2>
        {run?.completedAt && (
          <span className="font-mono text-xs text-muted-foreground">
            from the run of {formatReportDate(run.completedAt)}
          </span>
        )}
      </div>

      {!run || highlights.length === 0 ? (
        <p className="border-b py-6 font-heading text-2xl italic leading-snug text-muted-foreground">
          {run
            ? "The latest run produced no Reports for your current targets."
            : "No completed Research Run yet — the digest appears after your first run."}
        </p>
      ) : (
        <>
          <p className="border-b py-6 font-heading text-2xl italic leading-snug">
            {ledeSentence(highlights)}
          </p>
          <ul>
            {highlights.map((highlight) => {
              const urgent = (highlight.delta?.newAdvisories.length ?? 0) > 0;
              return (
                <li key={highlight.reportId} className="border-b">
                  <Link
                    href={`/reports/${segmentFromTargetType(highlight.targetType)}/${highlight.targetId}/${highlight.reportId}`}
                    className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
                  >
                    <span className="text-sm font-medium group-hover:underline group-hover:underline-offset-4">
                      {highlight.targetName}
                    </span>
                    <span
                      className={
                        urgent
                          ? "text-sm text-destructive"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {deltaSummary(highlight.delta)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
