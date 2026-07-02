import { describe, it, expect, vi, afterEach } from "vitest";

describe("fetchCurated", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("combines GitHub release notes and NVD advisories", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input: string | URL | Request) => {
      const url = input.toString();
      if (url.includes("api.github.com/search/repositories")) {
        return new Response(JSON.stringify({ items: [{ full_name: "facebook/react" }] }), { status: 200 });
      }
      if (url.includes("api.github.com/repos/facebook/react/releases")) {
        return new Response(
          JSON.stringify([{ tag_name: "v19.2.0", body: "Breaking: removed legacy API" }]),
          { status: 200 }
        );
      }
      if (url.includes("services.nvd.nist.gov")) {
        return new Response(
          JSON.stringify({
            vulnerabilities: [{ cve: { id: "CVE-2024-1234", descriptions: [{ value: "XSS vulnerability" }] } }],
          }),
          { status: 200 }
        );
      }
      throw new Error(`Unexpected fetch: ${url}`);
    });

    const { fetchCurated } = await import("@/lib/research/sources/curated");
    const result = await fetchCurated("React");

    expect(result).toContain("v19.2.0");
    expect(result).toContain("Breaking: removed legacy API");
    expect(result).toContain("CVE-2024-1234");
    expect(result).toContain("XSS vulnerability");
  });

  it("includes the pinned version when provided", async () => {
    vi.spyOn(global, "fetch").mockImplementation(
      async () => new Response(JSON.stringify({ items: [] }), { status: 200 })
    );

    const { fetchCurated } = await import("@/lib/research/sources/curated");
    const result = await fetchCurated("React", "19.2.0");

    expect(result).toContain("Pinned version: 19.2.0");
  });

  it("throws on a non-OK response instead of producing hollow content", async () => {
    vi.spyOn(global, "fetch").mockImplementation(
      async () => new Response("rate limit exceeded", { status: 403 })
    );

    const { fetchCurated } = await import("@/lib/research/sources/curated");

    await expect(fetchCurated("React")).rejects.toThrow(/403/);
  });
});
