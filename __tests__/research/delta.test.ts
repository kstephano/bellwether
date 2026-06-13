import { describe, it, expect } from "vitest";
import type { ReportSections } from "@/lib/research/types";

const base: ReportSections = {
  changeDigest: { items: [{ description: "v1.0.0 released" }] },
  currentState: { summary: "Stable", gotchas: [] },
  strategicOutlook: { risks: [], opportunities: [] },
  securityAdvisories: { advisories: [{ id: "CVE-2024-001", summary: "XSS vuln" }] },
};

describe("computeDeltaSection", () => {
  it("returns null when there is no previous Report", async () => {
    const { computeDeltaSection } = await import("@/lib/research/delta");
    expect(computeDeltaSection(base, null)).toBeNull();
  });

  it("identifies new Security Advisories added since the previous Report", async () => {
    const { computeDeltaSection } = await import("@/lib/research/delta");
    const previous: ReportSections = {
      ...base,
      securityAdvisories: { advisories: [{ id: "CVE-2024-001", summary: "XSS vuln" }] },
    };
    const current: ReportSections = {
      ...base,
      securityAdvisories: {
        advisories: [
          { id: "CVE-2024-001", summary: "XSS vuln" },
          { id: "CVE-2024-002", summary: "RCE vuln" },
        ],
      },
    };

    const delta = computeDeltaSection(current, previous);
    expect(delta?.newAdvisories).toHaveLength(1);
    expect(delta?.newAdvisories[0].id).toBe("CVE-2024-002");
    expect(delta?.resolvedAdvisories).toHaveLength(0);
  });

  it("identifies Security Advisories resolved since the previous Report", async () => {
    const { computeDeltaSection } = await import("@/lib/research/delta");
    const previous: ReportSections = {
      ...base,
      securityAdvisories: {
        advisories: [
          { id: "CVE-2024-001", summary: "XSS vuln" },
          { id: "CVE-2024-002", summary: "RCE vuln" },
        ],
      },
    };
    const current: ReportSections = {
      ...base,
      securityAdvisories: { advisories: [{ id: "CVE-2024-001", summary: "XSS vuln" }] },
    };

    const delta = computeDeltaSection(current, previous);
    expect(delta?.resolvedAdvisories).toHaveLength(1);
    expect(delta?.resolvedAdvisories[0].id).toBe("CVE-2024-002");
    expect(delta?.newAdvisories).toHaveLength(0);
  });

  it("identifies new items in the Change Digest", async () => {
    const { computeDeltaSection } = await import("@/lib/research/delta");
    const previous: ReportSections = {
      ...base,
      changeDigest: { items: [{ description: "v1.0.0 released" }] },
    };
    const current: ReportSections = {
      ...base,
      changeDigest: {
        items: [{ description: "v1.0.0 released" }, { description: "v1.1.0 released" }],
      },
    };

    const delta = computeDeltaSection(current, previous);
    expect(delta?.newChanges).toHaveLength(1);
    expect(delta?.newChanges[0].description).toBe("v1.1.0 released");
  });
});
