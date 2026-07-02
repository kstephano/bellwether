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

describe.skipIf(skipIfNoDb)("listResearchRuns", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(process.env.TEST_DATABASE_URL!);
  });

  afterEach(async () => {
    await db.delete(researchRuns).where(eq(researchRuns.userId, TEST_USER));
    await db.delete(researchRuns).where(eq(researchRuns.userId, "other-user-runs"));
  });

  it("returns only the user's runs, newest first", async () => {
    const { createResearchRun, updateResearchRunStatus, listResearchRuns } = await import(
      "@/lib/db/repository"
    );
    const first = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    await updateResearchRunStatus(db, first.id, "RUNNING");
    await updateResearchRunStatus(db, first.id, "COMPLETED");
    const second = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    await updateResearchRunStatus(db, second.id, "RUNNING");
    await createResearchRun(db, { userId: "other-user-runs", triggeredBy: "CRON" });

    const runs = await listResearchRuns(db, TEST_USER);

    expect(runs.map((r) => r.id)).toEqual([second.id, first.id]);
    expect(runs[0].status).toBe("RUNNING");
    expect(runs[1].status).toBe("COMPLETED");
  });
});
