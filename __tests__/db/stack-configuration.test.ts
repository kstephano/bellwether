import { describe, it, expect, beforeAll, afterEach } from "vitest";
import { createDbClient, type DbClient } from "@/lib/db/client";
import {
  createStackEntry,
  listStackEntries,
  updateStackEntry,
  deleteStackEntry,
  listCategories,
  createCategory,
  deleteCategory,
  createFreetextTopic,
  listFreetextTopics,
  updateFreetextTopic,
  deleteFreetextTopic,
} from "@/lib/db/repository";
import { categories, stackEntries, freetextTopics } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";

const TEST_USER = "test-user-stack-config";
const OTHER_USER = "test-user-other";

const skipIfNoDb = !process.env.TEST_DATABASE_URL;

describe.skipIf(skipIfNoDb)("Stack Configuration repository", () => {
  let db: DbClient;
  let defaultCategoryId: string;

  beforeAll(async () => {
    db = createDbClient(process.env.TEST_DATABASE_URL!);
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.isDefault, true))
      .limit(1);
    if (!cats[0]) throw new Error("No default categories — run migrations and seed");
    defaultCategoryId = cats[0].id;
  });

  afterEach(async () => {
    await db
      .delete(stackEntries)
      .where(or(eq(stackEntries.userId, TEST_USER), eq(stackEntries.userId, OTHER_USER)));
    await db
      .delete(freetextTopics)
      .where(
        or(eq(freetextTopics.userId, TEST_USER), eq(freetextTopics.userId, OTHER_USER))
      );
  });

  // ── Stack Entry ───────────────────────────────────────────────────────────

  it("creates a Stack Entry and returns it with an id", async () => {
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
      version: "18.3",
    });

    expect(entry.id).toBeDefined();
    expect(entry.technology).toBe("React");
    expect(entry.version).toBe("18.3");
  });

  it("Stack Entries are isolated per user", async () => {
    await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });
    await createStackEntry(db, {
      userId: OTHER_USER,
      categoryId: defaultCategoryId,
      technology: "Vue",
    });

    const entries = await listStackEntries(db, TEST_USER);
    expect(entries).toHaveLength(1);
    expect(entries[0].technology).toBe("React");
  });

  it("updates a Stack Entry", async () => {
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
      version: "18.3",
    });

    const updated = await updateStackEntry(db, entry.id, TEST_USER, {
      technology: "React",
      version: "19.0",
    });

    expect(updated.version).toBe("19.0");
  });

  it("deletes a Stack Entry", async () => {
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: defaultCategoryId,
      technology: "React",
    });

    await deleteStackEntry(db, entry.id, TEST_USER);

    const entries = await listStackEntries(db, TEST_USER);
    expect(entries).toHaveLength(0);
  });

  // ── Category ──────────────────────────────────────────────────────────────

  it("seven default Categories exist after migration", async () => {
    const cats = await listCategories(db);
    const defaults = cats.filter((c) => c.isDefault);
    expect(defaults).toHaveLength(7);
    const names = defaults.map((c) => c.name);
    expect(names).toContain("Front End");
    expect(names).toContain("Back End");
    expect(names).toContain("Infrastructure");
    expect(names).toContain("AI");
    expect(names).toContain("Environment");
    expect(names).toContain("Data Platform");
    expect(names).toContain("Security");
  });

  it("default Categories cannot be deleted", async () => {
    await expect(deleteCategory(db, defaultCategoryId)).rejects.toThrow(
      "Default categories cannot be deleted"
    );
  });

  it("creates and deletes a custom Category", async () => {
    const cat = await createCategory(db, "Custom");
    expect(cat.id).toBeDefined();
    expect(cat.isDefault).toBe(false);

    await deleteCategory(db, cat.id);
    const cats = await listCategories(db);
    expect(cats.find((c) => c.id === cat.id)).toBeUndefined();
  });

  it("rejects deleting a custom Category that still contains Stack Entries", async () => {
    const cat = await createCategory(db, "Occupied Custom");
    const entry = await createStackEntry(db, {
      userId: TEST_USER,
      categoryId: cat.id,
      technology: "React",
    });

    await expect(deleteCategory(db, cat.id)).rejects.toThrow(
      "Category still contains Stack Entries — empty it first"
    );

    // Once emptied, the same Category deletes cleanly.
    await deleteStackEntry(db, entry.id, TEST_USER);
    await deleteCategory(db, cat.id);
    const cats = await listCategories(db);
    expect(cats.find((c) => c.id === cat.id)).toBeUndefined();
  });

  // ── Free-text Topic ───────────────────────────────────────────────────────

  it("creates a Free-text Topic with UNCATEGORISED_TECH type", async () => {
    const topic = await createFreetextTopic(db, {
      userId: TEST_USER,
      text: "Bun runtime",
      type: "UNCATEGORISED_TECH",
    });

    expect(topic.id).toBeDefined();
    expect(topic.type).toBe("UNCATEGORISED_TECH");
  });

  it("creates a Free-text Topic with STANDALONE_TOPIC type", async () => {
    const topic = await createFreetextTopic(db, {
      userId: TEST_USER,
      text: "AI coding assistants landscape",
      type: "STANDALONE_TOPIC",
    });

    expect(topic.type).toBe("STANDALONE_TOPIC");
  });

  it("updates a Free-text Topic", async () => {
    const topic = await createFreetextTopic(db, {
      userId: TEST_USER,
      text: "Bun runtime",
      type: "UNCATEGORISED_TECH",
    });

    const updated = await updateFreetextTopic(db, topic.id, TEST_USER, {
      text: "Bun v2 runtime",
    });

    expect(updated.text).toBe("Bun v2 runtime");
  });

  it("deletes a Free-text Topic", async () => {
    const topic = await createFreetextTopic(db, {
      userId: TEST_USER,
      text: "Bun runtime",
      type: "UNCATEGORISED_TECH",
    });

    await deleteFreetextTopic(db, topic.id, TEST_USER);

    const topics = await listFreetextTopics(db, TEST_USER);
    expect(topics).toHaveLength(0);
  });

  it("Free-text Topics are isolated per user", async () => {
    await createFreetextTopic(db, {
      userId: TEST_USER,
      text: "Topic A",
      type: "STANDALONE_TOPIC",
    });
    await createFreetextTopic(db, {
      userId: OTHER_USER,
      text: "Topic B",
      type: "STANDALONE_TOPIC",
    });

    const topics = await listFreetextTopics(db, TEST_USER);
    expect(topics).toHaveLength(1);
    expect(topics[0].text).toBe("Topic A");
  });
});
