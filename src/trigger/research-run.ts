import { schedules, task } from "@trigger.dev/sdk";
import { getDb } from "@/lib/db/client";
import {
  createResearchRun,
  updateResearchRunStatus,
  listStackEntries,
  listFreetextTopics,
  listUserIdsWithTargets,
  writeAuditLog,
} from "@/lib/db/repository";
import { runResearchPipeline } from "@/lib/research/pipeline";
import { fetchCurated } from "@/lib/research/sources/curated";
import { fetchUserSources } from "@/lib/research/sources/user-sources";
import { search } from "@/lib/research/sources/search";
import { synthesise } from "@/lib/research/sources/synthesise";
import type { ResearchClients } from "@/lib/research/types";

// Runs the full research pipeline for every Stack Entry and Free-text Topic
// belonging to userId, flipping the Research Run RUNNING → COMPLETED/FAILED.
async function executeResearchRun(researchRunId: string, userId: string) {
  const db = getDb();
  await updateResearchRunStatus(db, researchRunId, "RUNNING");

  try {
    const clients: ResearchClients = {
      fetchCurated,
      fetchUserSources,
      search,
      synthesise,
      log: (service, characterCount) =>
        writeAuditLog(db, researchRunId, service, characterCount),
    };

    const entries = await listStackEntries(db, userId);
    for (const entry of entries) {
      await runResearchPipeline(
        db,
        researchRunId,
        { id: entry.id, technology: entry.technology, version: entry.version },
        "STACK_ENTRY",
        clients
      );
    }

    const topics = await listFreetextTopics(db, userId);
    for (const topic of topics) {
      await runResearchPipeline(
        db,
        researchRunId,
        { id: topic.id, text: topic.text },
        "FREE_TEXT_TOPIC",
        clients
      );
    }

    await updateResearchRunStatus(db, researchRunId, "COMPLETED");
  } catch (error) {
    await updateResearchRunStatus(db, researchRunId, "FAILED");
    throw error;
  }
}

// Monthly cron — fires on the 1st of each month at 08:00 UTC
export const monthlyResearchRun = schedules.task({
  id: "monthly-research-run",
  cron: "0 8 1 * *",
  run: async () => {
    const db = getDb();
    const userIds = await listUserIdsWithTargets(db);
    for (const userId of userIds) {
      const run = await createResearchRun(db, { userId, triggeredBy: "CRON" });
      await executeResearchRun(run.id, userId);
    }
  },
});

// Manual trigger — same job, invoked by POST /api/research-runs
export const manualResearchRun = task({
  id: "manual-research-run",
  run: async (payload: { researchRunId: string; userId: string }) => {
    await executeResearchRun(payload.researchRunId, payload.userId);
  },
});
