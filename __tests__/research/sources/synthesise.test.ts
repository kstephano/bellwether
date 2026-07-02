import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ReportSections } from "@/lib/research/types";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: createMock };
  },
}));

describe("synthesise (Claude)", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    createMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the ReportSections emitted by the forced tool call", async () => {
    const sections: ReportSections = {
      changeDigest: { items: [{ description: "React 19.2 shipped a stable compiler" }] },
      currentState: { summary: "Stable and widely adopted", gotchas: ["Legacy context removed"] },
      strategicOutlook: { risks: ["Deprecations land fast"], opportunities: ["Compiler perf wins"] },
      securityAdvisories: { advisories: [{ id: "CVE-2024-1234", summary: "XSS in server renderer" }] },
    };
    createMock.mockResolvedValue({
      content: [{ type: "tool_use", name: "emit_report", input: sections }],
    });

    const { synthesise } = await import("@/lib/research/sources/synthesise");
    const result = await synthesise("raw research text about React");

    expect(result).toEqual(sections);

    // Uses Claude Sonnet 4.6 with a forced tool call.
    const args = createMock.mock.calls[0][0];
    expect(args.model).toBe("claude-sonnet-4-6");
    expect(args.tool_choice).toEqual({ type: "tool", name: "emit_report" });
    expect(args.tools[0].name).toBe("emit_report");
    // The raw research text is passed to the model.
    expect(JSON.stringify(args.messages)).toContain("raw research text about React");
  });

  it("throws when ANTHROPIC_API_KEY is missing", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    const { synthesise } = await import("@/lib/research/sources/synthesise");

    await expect(synthesise("anything")).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });
});
