import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { getDb } from "@/lib/db/client";
import { getReportForUser } from "@/lib/db/repository";
import type { DeltaSection, ReportSections } from "@/lib/research/types";
import { exportReportAsMarkdown } from "@/lib/report/export";
import { ExportMarkdownButton } from "../../../export-markdown-button";
import {
  TARGET_TYPE_LABELS,
  formatReportDate,
  targetTypeFromSegment,
} from "../../../target-type";

function ReportSection({
  title,
  severity = false,
  children,
}: {
  title: string;
  severity?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2
        className={cn(
          "kicker border-b-2 pb-2",
          severity
            ? "border-destructive text-destructive"
            : "border-foreground text-foreground"
        )}
      >
        {title}
      </h2>
      <div className="pt-5">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-heading text-sm italic text-muted-foreground">{children}</p>
  );
}

export default async function ReportReadPage({
  params,
}: {
  params: Promise<{ targetType: string; targetId: string; reportId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const { targetType: segment, targetId, reportId } = await params;
  const targetType = targetTypeFromSegment(segment);
  if (!targetType) notFound();

  const found = await getReportForUser(getDb(), reportId, session.user.email);
  if (!found || found.report.targetId !== targetId || found.report.targetType !== targetType) {
    notFound();
  }
  const { report, target } = found;

  const delta = report.deltaSection as DeltaSection | null;
  const changeDigest = report.changeDigest as ReportSections["changeDigest"];
  const currentState = report.currentState as ReportSections["currentState"];
  const strategicOutlook = report.strategicOutlook as ReportSections["strategicOutlook"];
  const securityAdvisories = report.securityAdvisories as ReportSections["securityAdvisories"];

  const markdown = exportReportAsMarkdown({
    deltaSection: delta,
    changeDigest,
    currentState,
    strategicOutlook,
    securityAdvisories,
  });
  const filename = `bellwether-${target.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${report.createdAt.toISOString().slice(0, 10)}.md`;

  const deltaIsQuiet =
    delta &&
    delta.newAdvisories.length === 0 &&
    delta.resolvedAdvisories.length === 0 &&
    delta.newChanges.length === 0;

  return (
    <article className="mx-auto max-w-2xl">
      <header>
        <p className="kicker">
          <Link href="/reports" className="hover:text-foreground">
            Reports
          </Link>{" "}
          /{" "}
          <Link href={`/reports/${segment}/${targetId}`} className="hover:text-foreground">
            {target.name}
          </Link>{" "}
          · {TARGET_TYPE_LABELS[targetType]}
        </p>
        <h1 className="mt-4 font-heading text-5xl font-black tracking-tight">
          {target.name}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs text-muted-foreground">
            Report of {formatReportDate(report.createdAt)}
          </p>
          <ExportMarkdownButton markdown={markdown} filename={filename} />
        </div>
      </header>

      {/* Delta Section leads: 30-second triage before the full read. */}
      <section className="mt-10 border-y-2 border-foreground py-6">
        <h2 className="kicker text-foreground">Delta Section</h2>
        {!delta ? (
          <p className="mt-4 font-heading text-lg italic text-muted-foreground">
            First Report for this target — nothing to compare against yet.
          </p>
        ) : deltaIsQuiet ? (
          <p className="mt-4 font-heading text-lg italic text-muted-foreground">
            A quiet month: no new advisories, resolutions, or changes since the
            previous Report.
          </p>
        ) : (
          <dl className="mt-4 space-y-4">
            {delta.newAdvisories.length > 0 && (
              <div>
                <dt className="kicker text-[10px] text-destructive">
                  New Security Advisories
                </dt>
                <dd className="mt-1.5 space-y-1">
                  {delta.newAdvisories.map((advisory) => (
                    <p key={advisory.id} className="text-sm">
                      <span className="font-mono text-xs font-semibold text-destructive">
                        {advisory.id}
                      </span>{" "}
                      {advisory.summary}
                    </p>
                  ))}
                </dd>
              </div>
            )}
            {delta.resolvedAdvisories.length > 0 && (
              <div>
                <dt className="kicker text-[10px] text-moss">Resolved</dt>
                <dd className="mt-1.5 font-mono text-xs text-muted-foreground">
                  {delta.resolvedAdvisories.map((advisory) => advisory.id).join(", ")}
                </dd>
              </div>
            )}
            {delta.newChanges.length > 0 && (
              <div>
                <dt className="kicker text-[10px]">New Changes</dt>
                <dd className="mt-1.5">
                  <ul className="space-y-1">
                    {delta.newChanges.map((change) => (
                      <li key={change.description} className="text-sm">
                        {change.description}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
          </dl>
        )}
      </section>

      <ReportSection title="Change Digest">
        {changeDigest.items.length === 0 ? (
          <Empty>Nothing published this period.</Empty>
        ) : (
          <ul className="space-y-2.5">
            {changeDigest.items.map((item) => (
              <li
                key={item.description}
                className="border-l-2 border-border pl-4 text-[15px] leading-relaxed"
              >
                {item.description}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection title="Current State">
        <p className="text-[15px] leading-relaxed first-letter:float-left first-letter:mr-2 first-letter:font-heading first-letter:text-5xl first-letter:font-black first-letter:leading-[0.85]">
          {currentState.summary}
        </p>
        {currentState.gotchas.length > 0 && (
          <div className="mt-5">
            <h3 className="kicker text-[10px]">Gotchas</h3>
            <ul className="mt-2 space-y-1.5">
              {currentState.gotchas.map((gotcha) => (
                <li key={gotcha} className="text-sm leading-relaxed">
                  — {gotcha}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ReportSection>

      <ReportSection title="Strategic Outlook">
        {strategicOutlook.risks.length === 0 &&
        strategicOutlook.opportunities.length === 0 ? (
          <Empty>Nothing on the horizon this period.</Empty>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="kicker text-[10px]">Risks</h3>
              {strategicOutlook.risks.length === 0 ? (
                <p className="mt-2 text-sm italic text-muted-foreground">None noted.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {strategicOutlook.risks.map((risk) => (
                    <li key={risk} className="text-sm leading-relaxed">
                      — {risk}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="kicker text-[10px]">Opportunities</h3>
              {strategicOutlook.opportunities.length === 0 ? (
                <p className="mt-2 text-sm italic text-muted-foreground">None noted.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {strategicOutlook.opportunities.map((opportunity) => (
                    <li key={opportunity} className="text-sm leading-relaxed">
                      — {opportunity}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </ReportSection>

      <ReportSection title="Security Advisories" severity>
        {securityAdvisories.advisories.length === 0 ? (
          <Empty>No known vulnerabilities this period.</Empty>
        ) : (
          <ul className="space-y-3">
            {securityAdvisories.advisories.map((advisory) => (
              <li
                key={advisory.id}
                className="border-l-2 border-destructive pl-4"
              >
                <p className="font-mono text-xs font-semibold text-destructive">
                  {advisory.id}
                </p>
                <p className="mt-1 text-sm leading-relaxed">{advisory.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </ReportSection>
    </article>
  );
}
