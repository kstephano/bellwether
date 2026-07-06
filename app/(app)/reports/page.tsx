import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db/client";
import { listTargetsWithReports } from "@/lib/db/repository";
import {
  TARGET_TYPE_LABELS,
  formatReportDate,
  segmentFromTargetType,
} from "./target-type";

export const metadata: Metadata = {
  title: "Reports",
};

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const targets = await listTargetsWithReports(getDb(), session.user.email);

  return (
    <div className="max-w-3xl">
      <header>
        <h1 className="font-heading text-3xl font-black tracking-tight">Reports</h1>
        <p className="mt-3 max-w-prose text-muted-foreground">
          Every target Bellwether has reported on, most recently covered first.
          Open a target to read its Reports over time.
        </p>
      </header>

      {targets.length === 0 ? (
        <p className="mt-10 border-y py-8 font-heading text-xl italic text-muted-foreground">
          No Reports yet. Configure your Stack, then trigger a Research Run
          from the Overview.
        </p>
      ) : (
        <ul className="mt-10 border-t-2 border-foreground">
          {targets.map((target) => (
            <li key={`${target.targetType}-${target.id}`} className="border-b">
              <Link
                href={`/reports/${segmentFromTargetType(target.targetType)}/${target.id}`}
                className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4"
              >
                <span className="font-heading text-xl font-bold tracking-tight group-hover:underline group-hover:underline-offset-4">
                  {target.name}
                </span>
                <span className="flex items-baseline gap-4">
                  <span className="kicker text-[10px]">
                    {TARGET_TYPE_LABELS[target.targetType]}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {target.reportCount}{" "}
                    {target.reportCount === 1 ? "Report" : "Reports"}
                    {target.latestReportAt &&
                      ` · latest ${formatReportDate(target.latestReportAt)}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
