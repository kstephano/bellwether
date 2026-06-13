import { describe, it, expect } from "vitest";
import type { ReportSections, DeltaSection } from "@/lib/research/types";

type ExportInput = ReportSections & { deltaSection?: DeltaSection | null };

const baseReport: ExportInput = {
  changeDigest: { items: [{ description: "v2.0.0 released with breaking changes" }] },
  currentState: { summary: "Widely adopted, stable API", gotchas: ["SSR hydration mismatch"] },
  strategicOutlook: { risks: ["Bundle size increasing"], opportunities: ["Server Components"] },
  securityAdvisories: { advisories: [{ id: "CVE-2024-001", summary: "XSS via dangerouslySetInnerHTML" }] },
  deltaSection: null,
};

describe("exportReportAsMarkdown", () => {
  it("output contains all four section headings with non-empty content", async () => {
    const { exportReportAsMarkdown } = await import("@/lib/report/export");
    const md = exportReportAsMarkdown(baseReport);

    expect(md).toContain("Change Digest");
    expect(md).toContain("v2.0.0 released");
    expect(md).toContain("Current State");
    expect(md).toContain("Widely adopted");
    expect(md).toContain("Strategic Outlook");
    expect(md).toContain("Bundle size");
    expect(md).toContain("Security Advisories");
    expect(md).toContain("CVE-2024-001");
  });

  it("includes Delta Section heading and content when deltaSection is present", async () => {
    const { exportReportAsMarkdown } = await import("@/lib/report/export");
    const report: ExportInput = {
      ...baseReport,
      deltaSection: {
        newAdvisories: [{ id: "CVE-2024-999", summary: "New critical" }],
        resolvedAdvisories: [],
        newChanges: [],
      },
    };

    const md = exportReportAsMarkdown(report);
    expect(md).toContain("Delta Section");
    expect(md).toContain("CVE-2024-999");
  });

  it("omits Delta Section when deltaSection is null", async () => {
    const { exportReportAsMarkdown } = await import("@/lib/report/export");
    const md = exportReportAsMarkdown({ ...baseReport, deltaSection: null });
    expect(md).not.toContain("Delta Section");
  });

  it("uses canonical section names from the domain glossary", async () => {
    const { exportReportAsMarkdown } = await import("@/lib/report/export");
    const md = exportReportAsMarkdown(baseReport);

    expect(md).toContain("## Change Digest");
    expect(md).toContain("## Current State");
    expect(md).toContain("## Strategic Outlook");
    expect(md).toContain("## Security Advisories");
    // Ensure avoided synonyms are not used
    expect(md).not.toContain("Threats");
    expect(md).not.toContain("Changelog");
    expect(md).not.toContain("Best practices");
    expect(md).not.toContain("CVE list");
  });
});
