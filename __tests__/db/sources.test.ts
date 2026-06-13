import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createDbClient, type DbClient } from "@/lib/db/client";
import { createStackEntry, createFreetextTopic } from "@/lib/db/repository";
import { categories, sources, stackEntries, freetextTopics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const TEST_USER = "test-user-sources";
const OTHER_USER = "test-user-sources-other";

const skipIfNoDb = !process.env.TEST_DATABASE_URL;

describe.skipIf(skipIfNoDb)("Source repository", () => {
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
    await db.delete(sources);
    await db.delete(stackEntries).where(eq(stackEntries.userId, TEST_USER));
    await db.delete(stackEntries).where(eq(stackEntries.userId, OTHER_USER));
    await db.delete(freetextTopics).where(eq(freetextTopics.userId, TEST_USER));
  });

  it("adds a Source to a Stack Entry and returns it with an id", async () => {
    const { addSource } = await import("@/lib/db/repository");
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });

    const source = await addSource(db, {
      targetId: entry.id,
      targetType: "STACK_ENTRY",
      type: "RSS",
      url: "https://example.com/feed.xml",
      userId: TEST_USER,
    });

    expect(source.id).toBeDefined();
    expect(source.url).toBe("https://example.com/feed.xml");
    expect(source.type).toBe("RSS");
  });

  it("adds a Source to a Free-text Topic", async () => {
    const { addSource } = await import("@/lib/db/repository");
    const topic = await createFreetextTopic(db, {
      userId: TEST_USER,
      text: "Bun runtime",
      type: "UNCATEGORISED_TECH",
    });

    const source = await addSource(db, {
      targetId: topic.id,
      targetType: "FREE_TEXT_TOPIC",
      type: "URL",
      url: "https://bun.sh/blog",
      userId: TEST_USER,
    });

    expect(source.id).toBeDefined();
    expect(source.targetType).toBe("FREE_TEXT_TOPIC");
  });

  it("listing Sources for a target returns only that target's Sources", async () => {
    const { addSource, listSources } = await import("@/lib/db/repository");
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

    await addSource(db, {
      targetId: entryA.id,
      targetType: "STACK_ENTRY",
      type: "RSS",
      url: "https://react.dev/feed",
      userId: TEST_USER,
    });
    await addSource(db, {
      targetId: entryB.id,
      targetType: "STACK_ENTRY",
      type: "RSS",
      url: "https://vuejs.org/feed",
      userId: TEST_USER,
    });

    const sourcesForA = await listSources(db, entryA.id, "STACK_ENTRY");
    expect(sourcesForA).toHaveLength(1);
    expect(sourcesForA[0].url).toBe("https://react.dev/feed");
  });

  it("removes a Source", async () => {
    const { addSource, listSources, removeSource } = await import("@/lib/db/repository");
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });
    const source = await addSource(db, {
      targetId: entry.id,
      targetType: "STACK_ENTRY",
      type: "URL",
      url: "https://react.dev",
      userId: TEST_USER,
    });

    await removeSource(db, source.id, TEST_USER);

    const remaining = await listSources(db, entry.id, "STACK_ENTRY");
    expect(remaining).toHaveLength(0);
  });

  it("cannot add a Source to a Stack Entry owned by another user", async () => {
    const { addSource } = await import("@/lib/db/repository");
    const entry = await createStackEntry(db, {
      userId: OTHER_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });

    await expect(
      addSource(db, {
        targetId: entry.id,
        targetType: "STACK_ENTRY",
        type: "RSS",
        url: "https://example.com/feed.xml",
        userId: TEST_USER,
      })
    ).rejects.toThrow("not owned by user");
  });
});
