import { describe, it, expect } from "vitest";

describe("composeNotificationEmail", () => {
  it("subject includes advisory count when COMPLETED run has Security Advisories", async () => {
    const { composeNotificationEmail } = await import("@/lib/email/notification");
    const { subject } = composeNotificationEmail(
      "COMPLETED",
      { advisoryCount: 3, changeCount: 5 },
      "https://bellwether.app/dashboard"
    );
    expect(subject).toContain("3");
    expect(subject).toContain("Security Advisor");
  });

  it("subject falls back to change count when COMPLETED run has no advisories", async () => {
    const { composeNotificationEmail } = await import("@/lib/email/notification");
    const { subject } = composeNotificationEmail(
      "COMPLETED",
      { advisoryCount: 0, changeCount: 7 },
      "https://bellwether.app/dashboard"
    );
    expect(subject).toContain("7");
    expect(subject).toContain("change");
    expect(subject).not.toContain("Security");
  });

  it("subject prompts re-trigger for a FAILED run", async () => {
    const { composeNotificationEmail } = await import("@/lib/email/notification");
    const { subject } = composeNotificationEmail(
      "FAILED",
      { advisoryCount: 0, changeCount: 0 },
      "https://bellwether.app/dashboard"
    );
    expect(subject.toLowerCase()).toContain("failed");
  });

  it("body always contains the dashboard URL", async () => {
    const { composeNotificationEmail } = await import("@/lib/email/notification");
    const url = "https://bellwether.app/dashboard";
    const completed = composeNotificationEmail("COMPLETED", { advisoryCount: 0, changeCount: 1 }, url);
    const failed = composeNotificationEmail("FAILED", { advisoryCount: 0, changeCount: 0 }, url);
    expect(completed.body).toContain(url);
    expect(failed.body).toContain(url);
  });
});
