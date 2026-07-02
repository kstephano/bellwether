import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createDbClient, type DbClient } from "@/lib/db/client";
import { auditLog, researchRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER = "test-user-audit";
const skipIfNoDb = !process.env.TEST_DATABASE_URL;

describe.skipIf(skipIfNoDb)("writeAuditLog", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(process.env.TEST_DATABASE_URL!);
  });

  afterEach(async () => {
    const runs = await db
      .select({ id: researchRuns.id })
      .from(researchRuns)
      .where(eq(researchRuns.userId, TEST_USER));
    for (const run of runs) {
      await db.delete(auditLog).where(eq(auditLog.researchRunId, run.id));
    }
    await db.delete(researchRuns).where(eq(researchRuns.userId, TEST_USER));
  });

  it("records a usage entry against a research run", async () => {
    const { createResearchRun, writeAuditLog } = await import("@/lib/db/repository");
    const run = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });

    await writeAuditLog(db, run.id, "TAVILY", 1234);

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.researchRunId, run.id));

    expect(rows).toHaveLength(1);
    expect(rows[0].service).toBe("TAVILY");
    expect(rows[0].characterCount).toBe(1234);
  });

  it("records separate entries per service", async () => {
    const { createResearchRun, writeAuditLog } = await import("@/lib/db/repository");
    const run = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });

    await writeAuditLog(db, run.id, "TAVILY", 10);
    await writeAuditLog(db, run.id, "ANTHROPIC", 20);

    const rows = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.researchRunId, run.id));

    expect(rows).toHaveLength(2);
    const byService = Object.fromEntries(rows.map((r) => [r.service, r.characterCount]));
    expect(byService).toEqual({ TAVILY: 10, ANTHROPIC: 20 });
  });
});
