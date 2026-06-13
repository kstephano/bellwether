import { schedules, task } from "@trigger.dev/sdk/v3";

// Monthly cron — fires on the 1st of each month at 08:00 UTC
export const monthlyResearchRun = schedules.task({
  id: "monthly-research-run",
  cron: "0 8 1 * *",
  run: async () => {
    // TODO (issue #12): fetch authenticated user, create Research Run record
    // with triggeredBy: "CRON", then invoke runResearchPipeline for each
    // Stack Entry and Free-text Topic.
  },
});

// Manual trigger — same job, invoked by POST /api/research-runs
export const manualResearchRun = task({
  id: "manual-research-run",
  run: async (payload: { researchRunId: string; userId: string }) => {
    // TODO (issue #12): invoke runResearchPipeline for each Stack Entry
    // and Free-text Topic belonging to userId.
    void payload;
  },
});
