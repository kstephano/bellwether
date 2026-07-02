import { auth } from "@/auth";
import { tasks } from "@trigger.dev/sdk";
import type { manualResearchRun } from "@/src/trigger/research-run";
import { getDb } from "@/lib/db/client";
import { createResearchRun, listResearchRuns } from "@/lib/db/repository";

// The session carries no stable id, so the user's email is the userId
// throughout the app.
async function sessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

export async function POST() {
  const userId = await sessionUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const run = await createResearchRun(getDb(), { userId, triggeredBy: "MANUAL" });
  await tasks.trigger<typeof manualResearchRun>("manual-research-run", {
    researchRunId: run.id,
    userId,
  });

  return Response.json({ id: run.id, status: run.status }, { status: 202 });
}

export async function GET() {
  const userId = await sessionUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runs = await listResearchRuns(getDb(), userId);
  return Response.json({ runs });
}
