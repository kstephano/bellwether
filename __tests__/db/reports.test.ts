import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createDbClient, type DbClient } from "@/lib/db/client";
import { createResearchRun, createStackEntry } from "@/lib/db/repository";
import {
  categories,
  reports,
  researchRuns,
  stackEntries,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import type { ReportSections } from "@/lib/research/types";

const TEST_USER = "test-user-reports";
const OTHER_USER = "test-user-reports-other";
const skipIfNoDb = !process.env.TEST_DATABASE_URL;

const sampleSections: ReportSections = {
  changeDigest: { items: [{ description: "v2.0 released" }] },
  currentState: { summary: "Stable", gotchas: [] },
  strategicOutlook: { risks: [], opportunities: [] },
  securityAdvisories: { advisories: [{ id: "CVE-001", summary: "XSS" }] },
};

describe.skipIf(skipIfNoDb)("Report repository", () => {
  let db: DbClient;
  let defaultCategoryId: string;

  beforeAll(async () => {
    db = createDbClient(process.env.TEST_DATABASE_URL!);
    const [cat] = await db
      .select()
      .from(categories)
      .where(eq(categories.isDefault, true))
      .limit(1);
    if (!cat) throw new Error("No default categories — run migrations and seed");
    defaultCategoryId = cat.id;
  });

  afterEach(async () => {
    const runs = await db
      .select({ id: researchRuns.id })
      .from(researchRuns)
      .where(inArray(researchRuns.userId, [TEST_USER, OTHER_USER]));
    const runIds = runs.map((r) => r.id);
    if (runIds.length) {
      await db.delete(reports).where(inArray(reports.researchRunId, runIds));
    }
    await db.delete(researchRuns).where(eq(researchRuns.userId, TEST_USER));
    await db.delete(researchRuns).where(eq(researchRuns.userId, OTHER_USER));
    await db.delete(stackEntries).where(eq(stackEntries.userId, TEST_USER));
    await db.delete(stackEntries).where(eq(stackEntries.userId, OTHER_USER));
  });

  async function seedReport(userId: string, entryId: string, runId: string, delta = false) {
    const [row] = await db.insert(reports).values({
      researchRunId: runId,
      targetId: entryId,
      targetType: "STACK_ENTRY",
      deltaSection: delta ? { newAdvisories: [], resolvedAdvisories: [], newChanges: [] } : null,
      changeDigest: sampleSections.changeDigest,
      currentState: sampleSections.currentState,
      strategicOutlook: sampleSections.strategicOutlook,
      securityAdvisories: sampleSections.securityAdvisories,
    }).returning();
    return row;
  }

  it("listReportsForTarget returns Reports sorted by date descending", async () => {
    const { listReportsForTarget } = await import("@/lib/db/repository");
    const run = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });

    await seedReport(TEST_USER, entry.id, run.id);
    const run2 = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    await seedReport(TEST_USER, entry.id, run2.id);

    const result = await listReportsForTarget(db, entry.id, "STACK_ENTRY");
    expect(result).toHaveLength(2);
    expect(result[0].createdAt >= result[1].createdAt).toBe(true);
  });

  it("listReportsForTarget does not return Reports for a different target", async () => {
    const { listReportsForTarget } = await import("@/lib/db/repository");
    const run = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    const entryA = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });
    const entryB = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "Vue",
    });

    await seedReport(TEST_USER, entryA.id, run.id);
    await seedReport(TEST_USER, entryB.id, run.id);

    const result = await listReportsForTarget(db, entryA.id, "STACK_ENTRY");
    expect(result).toHaveLength(1);
    expect(result[0].targetId).toBe(entryA.id);
  });

  it("listTargetsWithReports returns only targets belonging to the user", async () => {
    const { listTargetsWithReports } = await import("@/lib/db/repository");
    const myRun = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    const otherRun = await createResearchRun(db, { userId: OTHER_USER, triggeredBy: "MANUAL" });
    const myEntry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });
    const otherEntry = await createStackEntry(db, {
      userId: OTHER_USER,
      categoryId: defaultCategoryId,
      technology: "Vue",
    });

    await seedReport(TEST_USER, myEntry.id, myRun.id);
    await seedReport(OTHER_USER, otherEntry.id, otherRun.id);

    const result = await listTargetsWithReports(db, TEST_USER);
    expect(result.every((r) => r.userId === TEST_USER)).toBe(true);
    expect(result.find((r) => r.id === otherEntry.id)).toBeUndefined();
  });

  it("getReport returns all sections and the Delta Section when present", async () => {
    const { getReport } = await import("@/lib/db/repository");
    const run = await createResearchRun(db, { userId: TEST_USER, triggeredBy: "MANUAL" });
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });
    const persisted = await seedReport(TEST_USER, entry.id, run.id, true);

    const report = await getReport(db, persisted.id);
    expect(report).not.toBeNull();
    expect(report!.changeDigest).toBeDefined();
    expect(report!.currentState).toBeDefined();
    expect(report!.strategicOutlook).toBeDefined();
    expect(report!.securityAdvisories).toBeDefined();
    expect(report!.deltaSection).not.toBeNull();
  });
});
