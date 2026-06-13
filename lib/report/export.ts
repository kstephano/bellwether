import type { ReportSections, DeltaSection } from "@/lib/research/types";

type ExportInput = ReportSections & { deltaSection?: DeltaSection | null };

export function exportReportAsMarkdown(report: ExportInput): string {
  const sections: string[] = [];

  if (report.deltaSection) {
    const d = report.deltaSection;
    const lines: string[] = [];
    if (d.newAdvisories.length)
      lines.push(`**New Security Advisories:** ${d.newAdvisories.map((a) => a.id).join(", ")}`);
    if (d.resolvedAdvisories.length)
      lines.push(`**Resolved:** ${d.resolvedAdvisories.map((a) => a.id).join(", ")}`);
    if (d.newChanges.length)
      lines.push(`**New Changes:** ${d.newChanges.map((c) => c.description).join("; ")}`);
    sections.push(`## Delta Section\n\n${lines.join("\n")}`);
  }

  sections.push(
    `## Change Digest\n\n${report.changeDigest.items.map((i) => `- ${i.description}`).join("\n")}`
  );

  const cs = report.currentState;
  const gotchas = cs.gotchas.length ? `\n\n**Gotchas:**\n${cs.gotchas.map((g) => `- ${g}`).join("\n")}` : "";
  sections.push(`## Current State\n\n${cs.summary}${gotchas}`);

  const so = report.strategicOutlook;
  const risks = so.risks.length ? `**Risks:**\n${so.risks.map((r) => `- ${r}`).join("\n")}` : "";
  const opps = so.opportunities.length ? `**Opportunities:**\n${so.opportunities.map((o) => `- ${o}`).join("\n")}` : "";
  sections.push(`## Strategic Outlook\n\n${[risks, opps].filter(Boolean).join("\n\n")}`);

  sections.push(
    `## Security Advisories\n\n${report.securityAdvisories.advisories.map((a) => `- **${a.id}**: ${a.summary}`).join("\n")}`
  );

  return `# Bellwether Report\n\n${sections.join("\n\n---\n\n")}`;
}
