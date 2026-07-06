import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { getTargetForUser, listReportsForTarget } from "@/lib/db/repository";
import type { DeltaSection } from "@/lib/research/types";
import {
  TARGET_TYPE_LABELS,
  formatReportDate,
  targetTypeFromSegment,
} from "../../target-type";

function deltaSummary(delta: DeltaSection | null): string {
  if (!delta) return "First Report for this target";
  const parts: string[] = [];
  if (delta.newAdvisories.length > 0) {
    parts.push(
      `${delta.newAdvisories.length} new ${delta.newAdvisories.length === 1 ? "advisory" : "advisories"}`
    );
  }
  if (delta.resolvedAdvisories.length > 0) {
    parts.push(`${delta.resolvedAdvisories.length} resolved`);
  }
  if (delta.newChanges.length > 0) {
    parts.push(
      `${delta.newChanges.length} new ${delta.newChanges.length === 1 ? "change" : "changes"}`
    );
  }
  return parts.length > 0 ? parts.join(" · ") : "No changes since the previous Report";
}

export default async function TargetTimelinePage({
  params,
}: {
  params: Promise<{ targetType: string; targetId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const { targetType: segment, targetId } = await params;
  const targetType = targetTypeFromSegment(segment);
  if (!targetType) notFound();

  const db = getDb();
  const target = await getTargetForUser(db, targetId, targetType, session.user.email);
  if (!target) notFound();

  const targetReports = await listReportsForTarget(db, targetId, targetType);

  return (
    <div className="max-w-3xl">
      <header>
        <p className="kicker">
          <Link href="/reports" className="hover:text-foreground">
            Reports
          </Link>{" "}
          / {TARGET_TYPE_LABELS[targetType]}
        </p>
        <h1 className="mt-3 font-heading text-3xl font-black tracking-tight">
          {target.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {targetReports.length} {targetReports.length === 1 ? "Report" : "Reports"},
          newest first.
        </p>
      </header>

      {targetReports.length === 0 ? (
        <p className="mt-10 border-y py-8 font-heading text-xl italic text-muted-foreground">
          No Reports for this target yet.
        </p>
      ) : (
        <ul className="mt-10 border-t-2 border-foreground">
          {targetReports.map((report) => {
            const delta = report.deltaSection as DeltaSection | null;
            const hasNewAdvisories = (delta?.newAdvisories.length ?? 0) > 0;
            return (
              <li key={report.id} className="border-b">
                <Link
                  href={`/reports/${segment}/${targetId}/${report.id}`}
                  className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
                >
                  <span className="font-heading text-xl font-bold tracking-tight group-hover:underline group-hover:underline-offset-4">
                    {formatReportDate(report.createdAt)}
                  </span>
                  <span
                    className={
                      hasNewAdvisories
                        ? "text-sm text-destructive"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {deltaSummary(delta)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
