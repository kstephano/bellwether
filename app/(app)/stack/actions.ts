"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import {
  createCategory,
  createFreetextTopic,
  createStackEntry,
  deleteCategory,
  deleteFreetextTopic,
  deleteStackEntry,
  updateFreetextTopic,
  updateStackEntry,
} from "@/lib/db/repository";

// Config mutations are Server Actions guarded by an auth check at the top,
// per ADR-0003; the polled /api/research-runs REST route is the one exception.
async function requireUserId(): Promise<string> {
  const session = await auth();
  const userId = session?.user?.email;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export type ActionResult = { error: string | null };

export async function createStackEntryAction(input: {
  categoryId: string;
  technology: string;
  version: string | null;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const technology = input.technology.trim();
  if (!technology) return { error: "Technology name is required" };
  await createStackEntry(getDb(), {
    userId,
    categoryId: input.categoryId,
    technology,
    version: input.version?.trim() || undefined,
  });
  revalidatePath("/stack");
  return { error: null };
}

export async function updateStackEntryAction(
  id: string,
  patch: { categoryId: string; technology: string; version: string | null }
): Promise<ActionResult> {
  const userId = await requireUserId();
  const technology = patch.technology.trim();
  if (!technology) return { error: "Technology name is required" };
  const updated = await updateStackEntry(getDb(), id, userId, {
    categoryId: patch.categoryId,
    technology,
    version: patch.version?.trim() || null,
  });
  if (!updated) return { error: "Stack Entry not found" };
  revalidatePath("/stack");
  return { error: null };
}

export async function deleteStackEntryAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await deleteStackEntry(getDb(), id, userId);
  revalidatePath("/stack");
  return { error: null };
}

// The Topic type is never surfaced in the UI; new Topics get a fixed
// default and the column is effectively dead data (issue #13).
export async function createFreetextTopicAction(text: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = text.trim();
  if (!trimmed) return { error: "Topic text is required" };
  await createFreetextTopic(getDb(), {
    userId,
    text: trimmed,
    type: "STANDALONE_TOPIC",
  });
  revalidatePath("/stack");
  return { error: null };
}

export async function updateFreetextTopicAction(
  id: string,
  text: string
): Promise<ActionResult> {
  const userId = await requireUserId();
  const trimmed = text.trim();
  if (!trimmed) return { error: "Topic text is required" };
  const updated = await updateFreetextTopic(getDb(), id, userId, { text: trimmed });
  if (!updated) return { error: "Free-text Topic not found" };
  revalidatePath("/stack");
  return { error: null };
}

export async function deleteFreetextTopicAction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await deleteFreetextTopic(getDb(), id, userId);
  revalidatePath("/stack");
  return { error: null };
}

export async function createCategoryAction(name: string): Promise<ActionResult> {
  await requireUserId();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Category name is required" };
  await createCategory(getDb(), trimmed);
  revalidatePath("/stack");
  return { error: null };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  await requireUserId();
  try {
    // Rejects default Categories and non-empty custom Categories; the
    // message is shown to the user as-is.
    await deleteCategory(getDb(), id);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Failed to delete Category",
    };
  }
  revalidatePath("/stack");
  return { error: null };
}
