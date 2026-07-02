import { describe, it, expect, vi, afterEach } from "vitest";

describe("fetchUserSources", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches each URL and returns its text content", async () => {
    const bodies: Record<string, string> = {
      "https://example.com/changelog": "v2.0 released",
      "https://example.com/blog": "Deep dive into the new API",
    };
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      return new Response(bodies[url.toString()], { status: 200 });
    });

    const { fetchUserSources } = await import("@/lib/research/sources/user-sources");
    const result = await fetchUserSources([
      "https://example.com/changelog",
      "https://example.com/blog",
    ]);

    expect(result).toEqual(["v2.0 released", "Deep dive into the new API"]);
  });

  it("skips URLs that fail to fetch so one dead source does not kill the run", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (url.toString().includes("dead")) {
        throw new Error("connection refused");
      }
      return new Response("still alive", { status: 200 });
    });

    const { fetchUserSources } = await import("@/lib/research/sources/user-sources");
    const result = await fetchUserSources([
      "https://example.com/dead",
      "https://example.com/live",
    ]);

    expect(result).toEqual(["still alive"]);
  });

  it("skips URLs that respond with a non-OK status", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (url) => {
      if (url.toString().includes("gone")) {
        return new Response("Not Found", { status: 404 });
      }
      return new Response("fresh content", { status: 200 });
    });

    const { fetchUserSources } = await import("@/lib/research/sources/user-sources");
    const result = await fetchUserSources([
      "https://example.com/gone",
      "https://example.com/live",
    ]);

    expect(result).toEqual(["fresh content"]);
  });
});
