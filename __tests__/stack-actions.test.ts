import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { auth } from "@/auth";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

// Seam 2 (issue #13 Testing Decisions): config mutations moved from REST
// routes to Server Actions (ADR-0003), so "unauthenticated mutations are
// refused" is verified by invoking a representative action without a session.
describe("config Server Action auth protection", () => {
  beforeEach(() => {
    mockAuth.mockReset();
  });

  it("rejects createStackEntryAction without a valid session", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const { createStackEntryAction } = await import("@/app/(app)/stack/actions");

    await expect(
      createStackEntryAction({
        categoryId: "some-category",
        technology: "React",
        version: null,
      })
    ).rejects.toThrow("Unauthorized");
  });

  it("rejects when the session has no email to act as userId", async () => {
    mockAuth.mockResolvedValueOnce({ user: {} });
    const { deleteStackEntryAction } = await import("@/app/(app)/stack/actions");

    await expect(deleteStackEntryAction("some-entry")).rejects.toThrow(
      "Unauthorized"
    );
  });
});
