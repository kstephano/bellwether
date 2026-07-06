"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import {
  createStackEntry,
  deleteStackEntry,
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
