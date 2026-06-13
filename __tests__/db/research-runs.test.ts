import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createDbClient, type DbClient } from "@/lib/db/client";
import { researchRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER = "test-user-runs";
const skipIfNoDb = !process.env.TEST_DATABASE_URL;

describe.skipIf(skipIfNoDb)("createResearchRun", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(process.env.TEST_DATABASE_URL!);
  });

  afterEach(async () => {
    await db.delete(researchRuns).where(eq(researchRuns.userId, TEST_USER));
  });

  it("persists triggeredBy CRON on a cron-triggered Research Run", async () => {
    const { createResearchRun } = await import("@/lib/db/repository");
    const run = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "CRON" });
    expect(run.triggeredBy).toBe("CRON");
    expect(run.status).toBe("PENDING");
  });

  it("persists triggeredBy MANUAL on a manually-triggered Research Run", async () => {
    const { createResearchRun } = await import("@/lib/db/repository");
    const run = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    expect(run.triggeredBy).toBe("MANUAL");
  });
});
