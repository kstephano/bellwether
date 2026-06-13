import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/auth";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

async function runMiddleware(url: string) {
  const { middleware } = await import("@/middleware");
  const req = new NextRequest(new URL(url, "http://localhost"));
  return middleware(req);
}

describe("middleware auth protection", () => {
  it("returns 401 for unauthenticated requests to API routes", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await runMiddleware("http://localhost/api/health");
    expect(response?.status).toBe(401);
  });

  it("redirects unauthenticated requests to app routes to the sign-in page", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await runMiddleware("http://localhost/dashboard");
    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toContain("/api/auth/signin");
  });

  it("allows authenticated requests to pass through to API routes", async () => {
    mockAuth.mockResolvedValueOnce({ user: { email: "test@example.com" } });
    const response = await runMiddleware("http://localhost/api/health");
    expect(response?.status).not.toBe(401);
    expect(response?.status).not.toBe(307);
  });

  it("allows authenticated requests to pass through to app routes", async () => {
    mockAuth.mockResolvedValueOnce({ user: { email: "test@example.com" } });
    const response = await runMiddleware("http://localhost/dashboard");
    expect(response?.status).not.toBe(401);
    expect(response?.status).not.toBe(307);
  });

  it("allows unauthenticated requests to NextAuth routes to pass through", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await runMiddleware("http://localhost/api/auth/signin");
    expect(response?.status).not.toBe(401);
    expect(response?.status).not.toBe(307);
  });
});
