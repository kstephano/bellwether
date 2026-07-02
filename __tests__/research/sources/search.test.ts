import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";

describe("search (Tavily)", () => {
  beforeEach(() => {
    vi.stubEnv("TAVILY_API_KEY", "test-tavily-key");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns the answer and result contents from Tavily", async () => {
    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            answer: "React 19.2 shipped with a new compiler.",
            results: [
              { title: "React 19.2 release", url: "https://react.dev/blog", content: "The compiler is now stable." },
              { title: "Migration notes", url: "https://react.dev/migrate", content: "Remove legacy context usage." },
            ],
          }),
          { status: 200 }
        );
      });

    const { search } = await import("@/lib/research/sources/search");
    const result = await search("React latest updates");

    expect(result).toContain("React 19.2 shipped with a new compiler.");
    expect(result).toContain("The compiler is now stable.");
    expect(result).toContain("Remove legacy context usage.");

    // Posts the query and API key to the Tavily endpoint.
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url.toString()).toContain("api.tavily.com/search");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(init?.body as string);
    expect(body.query).toBe("React latest updates");
    expect(body.api_key).toBe("test-tavily-key");
  });

  it("throws on a non-OK response instead of producing hollow content", async () => {
    vi.spyOn(global, "fetch").mockImplementation(
      async () => new Response(JSON.stringify({ error: "invalid api key" }), { status: 401 })
    );

    const { search } = await import("@/lib/research/sources/search");

    await expect(search("anything")).rejects.toThrow(/401/);
  });

  it("throws when TAVILY_API_KEY is missing", async () => {
    vi.stubEnv("TAVILY_API_KEY", "");

    const { search } = await import("@/lib/research/sources/search");

    await expect(search("anything")).rejects.toThrow(/TAVILY_API_KEY/);
  });
});
