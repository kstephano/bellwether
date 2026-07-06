import { eq, and, or, desc, count, max } from "drizzle-orm";
import type { DbClient } from "./client";
import { categories, stackEntries, freetextTopics, sources, researchRuns, reports, auditLog } from "./schema";

// ── Category ──────────────────────────────────────────────────────────────

export async function listCategories(db: DbClient) {
  return db.select().from(categories).orderBy(categories.createdAt);
}

export async function createCategory(db: DbClient, name: string) {
  const [row] = await db
    .insert(categories)
    .values({ name, isDefault: false })
    .returning();
  return row;
}

export async function deleteCategory(db: DbClient, id: string) {
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  if (!cat) throw new Error("Category not found");
  if (cat.isDefault) throw new Error("Default categories cannot be deleted");
  // Block-when-non-empty (issue #13): no cascade, no reassignment — deleting
  // a Category must never silently destroy Stack Entries or their history.
  const [occupant] = await db
    .select({ id: stackEntries.id })
    .from(stackEntries)
    .where(eq(stackEntries.categoryId, id))
    .limit(1);
  if (occupant) {
    throw new Error("Category still contains Stack Entries — empty it first");
  }
  await db.delete(categories).where(eq(categories.id, id));
}

// ── Stack Entry ───────────────────────────────────────────────────────────

export async function createStackEntry(
  db: DbClient,
  input: {
    userId: string;
    categoryId: string;
    technology: string;
    version?: string;
  }
) {
  const [row] = await db.insert(stackEntries).values(input).returning();
  return row;
}

export async function listStackEntries(db: DbClient, userId: string) {
  return db
    .select()
    .from(stackEntries)
    .where(eq(stackEntries.userId, userId));
}

export async function updateStackEntry(
  db: DbClient,
  id: string,
  userId: string,
  patch: Partial<{ categoryId: string; technology: string; version: string | null }>
) {
  const [row] = await db
    .update(stackEntries)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(stackEntries.id, id), eq(stackEntries.userId, userId)))
    .returning();
  return row;
}

export async function deleteStackEntry(db: DbClient, id: string, userId: string) {
  await db
    .delete(stackEntries)
    .where(and(eq(stackEntries.id, id), eq(stackEntries.userId, userId)));
}

// ── Free-text Topic ───────────────────────────────────────────────────────

export async function createFreetextTopic(
  db: DbClient,
  input: {
    userId: string;
    text: string;
    type: "UNCATEGORISED_TECH" | "STANDALONE_TOPIC";
  }
) {
  const [row] = await db.insert(freetextTopics).values(input).returning();
  return row;
}

export async function listFreetextTopics(db: DbClient, userId: string) {
  return db
    .select()
    .from(freetextTopics)
    .where(eq(freetextTopics.userId, userId));
}

export async function updateFreetextTopic(
  db: DbClient,
  id: string,
  userId: string,
  patch: Partial<{ text: string; type: "UNCATEGORISED_TECH" | "STANDALONE_TOPIC" }>
) {
  const [row] = await db
    .update(freetextTopics)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(freetextTopics.id, id), eq(freetextTopics.userId, userId)))
    .returning();
  return row;
}

export async function deleteFreetextTopic(db: DbClient, id: string, userId: string) {
  await db
    .delete(freetextTopics)
    .where(and(eq(freetextTopics.id, id), eq(freetextTopics.userId, userId)));
}

// ── Report ────────────────────────────────────────────────────────────────

export async function listReportsForTarget(
  db: DbClient,
  targetId: string,
  targetType: "STACK_ENTRY" | "FREE_TEXT_TOPIC"
) {
  return db
    .select()
    .from(reports)
    .where(and(eq(reports.targetId, targetId), eq(reports.targetType, targetType)))
    .orderBy(desc(reports.createdAt));
}

export async function listTargetsWithReports(db: DbClient, userId: string) {
  const entryRows = await db
    .select({
      id: stackEntries.id,
      userId: stackEntries.userId,
      name: stackEntries.technology,
      reportCount: count(reports.id),
      latestReportAt: max(reports.createdAt),
    })
    .from(stackEntries)
    .innerJoin(
      reports,
      and(eq(reports.targetId, stackEntries.id), eq(reports.targetType, "STACK_ENTRY"))
    )
    .where(eq(stackEntries.userId, userId))
    .groupBy(stackEntries.id, stackEntries.userId, stackEntries.technology);

  const topicRows = await db
    .select({
      id: freetextTopics.id,
      userId: freetextTopics.userId,
      name: freetextTopics.text,
      reportCount: count(reports.id),
      latestReportAt: max(reports.createdAt),
    })
    .from(freetextTopics)
    .innerJoin(
      reports,
      and(eq(reports.targetId, freetextTopics.id), eq(reports.targetType, "FREE_TEXT_TOPIC"))
    )
    .where(eq(freetextTopics.userId, userId))
    .groupBy(freetextTopics.id, freetextTopics.userId, freetextTopics.text);

  return [
    ...entryRows.map((row) => ({ ...row, targetType: "STACK_ENTRY" as const })),
    ...topicRows.map((row) => ({ ...row, targetType: "FREE_TEXT_TOPIC" as const })),
  ].sort(
    (a, b) => (b.latestReportAt?.getTime() ?? 0) - (a.latestReportAt?.getTime() ?? 0)
  );
}

export async function deleteReportsForRun(db: DbClient, researchRunId: string) {
  await db.delete(reports).where(eq(reports.researchRunId, researchRunId));
}

export async function getReport(db: DbClient, reportId: string) {
  const [row] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1);
  return row ?? null;
}

export async function getTargetForUser(
  db: DbClient,
  targetId: string,
  targetType: "STACK_ENTRY" | "FREE_TEXT_TOPIC",
  userId: string
): Promise<{ id: string; name: string } | null> {
  if (targetType === "STACK_ENTRY") {
    const [row] = await db
      .select()
      .from(stackEntries)
      .where(and(eq(stackEntries.id, targetId), eq(stackEntries.userId, userId)))
      .limit(1);
    return row ? { id: row.id, name: row.technology } : null;
  }
  const [row] = await db
    .select()
    .from(freetextTopics)
    .where(and(eq(freetextTopics.id, targetId), eq(freetextTopics.userId, userId)))
    .limit(1);
  return row ? { id: row.id, name: row.text } : null;
}

// Reports are strictly private (ADR-0002): a Report resolves only through
// a target owned by the requesting user.
export async function getReportForUser(
  db: DbClient,
  reportId: string,
  userId: string
) {
  const report = await getReport(db, reportId);
  if (!report) return null;
  const target = await getTargetForUser(db, report.targetId, report.targetType, userId);
  if (!target) return null;
  return { report, target };
}

// ── Research Run ──────────────────────────────────────────────────────────

export async function createResearchRun(
  db: DbClient,
  input: { userId: string; triggeredBy: "CRON" | "MANUAL" }
) {
  const [row] = await db.insert(researchRuns).values(input).returning();
  return row;
}

export async function updateResearchRunStatus(
  db: DbClient,
  id: string,
  status: "RUNNING" | "COMPLETED" | "FAILED"
) {
  const [row] = await db
    .update(researchRuns)
    .set({
      status,
      ...(status === "RUNNING" ? { startedAt: new Date() } : {}),
      ...(status === "COMPLETED" || status === "FAILED" ? { completedAt: new Date() } : {}),
    })
    .where(eq(researchRuns.id, id))
    .returning();
  return row;
}

export async function listUserIdsWithTargets(db: DbClient) {
  const entryUsers = await db
    .selectDistinct({ userId: stackEntries.userId })
    .from(stackEntries);
  const topicUsers = await db
    .selectDistinct({ userId: freetextTopics.userId })
    .from(freetextTopics);
  return [...new Set([...entryUsers, ...topicUsers].map((r) => r.userId))];
}

export async function listResearchRuns(db: DbClient, userId: string) {
  // No createdAt on research_runs; DESC on startedAt puts NULLs (PENDING
  // runs that haven't started) first, then most recently started.
  return db
    .select()
    .from(researchRuns)
    .where(eq(researchRuns.userId, userId))
    .orderBy(desc(researchRuns.startedAt));
}

export async function writeAuditLog(
  db: DbClient,
  researchRunId: string,
  service: "TAVILY" | "ANTHROPIC",
  characterCount: number
) {
  await db.insert(auditLog).values({ researchRunId, service, characterCount });
}

// ── Source ────────────────────────────────────────────────────────────────

async function assertTargetOwnership(
  db: DbClient,
  targetId: string,
  targetType: "STACK_ENTRY" | "FREE_TEXT_TOPIC",
  userId: string
) {
  if (targetType === "STACK_ENTRY") {
    const [row] = await db
      .select()
      .from(stackEntries)
      .where(and(eq(stackEntries.id, targetId), eq(stackEntries.userId, userId)))
      .limit(1);
    if (!row) throw new Error("Stack Entry not found or not owned by user");
  } else {
    const [row] = await db
      .select()
      .from(freetextTopics)
      .where(and(eq(freetextTopics.id, targetId), eq(freetextTopics.userId, userId)))
      .limit(1);
    if (!row) throw new Error("Free-text Topic not found or not owned by user");
  }
}

export async function addSource(
  db: DbClient,
  input: {
    targetId: string;
    targetType: "STACK_ENTRY" | "FREE_TEXT_TOPIC";
    type: "RSS" | "URL" | "GITHUB_REPO";
    url: string;
    userId: string;
  }
) {
  await assertTargetOwnership(db, input.targetId, input.targetType, input.userId);
  const { userId: _, ...values } = input;
  const [row] = await db.insert(sources).values(values).returning();
  return row;
}

export async function listSources(
  db: DbClient,
  targetId: string,
  targetType: "STACK_ENTRY" | "FREE_TEXT_TOPIC"
) {
  return db
    .select()
    .from(sources)
    .where(and(eq(sources.targetId, targetId), eq(sources.targetType, targetType)));
}

export async function removeSource(db: DbClient, id: string, userId: string) {
  const [source] = await db
    .select()
    .from(sources)
    .where(eq(sources.id, id))
    .limit(1);
  if (!source) throw new Error("Source not found");
  await assertTargetOwnership(db, source.targetId, source.targetType, userId);
  await db.delete(sources).where(eq(sources.id, id));
}
