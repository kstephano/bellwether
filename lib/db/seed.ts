import { getDb } from "./client";
import { categories } from "./schema";
import { eq } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  "Front End",
  "Back End",
  "Infrastructure",
  "AI",
  "Environment",
  "Data Platform",
  "Security",
];

export async function seedDefaultCategories() {
  const db = getDb();
  for (const name of DEFAULT_CATEGORIES) {
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, name))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(categories).values({ name, isDefault: true });
    }
  }
}
