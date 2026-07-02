"use client";

import { useCallback, useEffect, useState } from "react";

export type ResearchRunView = {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  triggeredBy: "CRON" | "MANUAL";
  startedAt: string | null;
  completedAt: string | null;
};

const STATUS_STYLES: Record<ResearchRunView["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  RUNNING: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

export function ResearchRunsPanel({ initialRuns }: { initialRuns: ResearchRunView[] }) {
  const [runs, setRuns] = useState(initialRuns);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/research-runs");
    if (!res.ok) return;
    const data = (await res.json()) as { runs: ResearchRunView[] };
    setRuns(data.runs);
  }, []);

  const hasActiveRun = runs.some(
    (run) => run.status === "PENDING" || run.status === "RUNNING"
  );

  useEffect(() => {
    if (!hasActiveRun) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [hasActiveRun, refresh]);

  async function runNow() {
    setTriggering(true);
    setError(null);
    try {
      const res = await fetch("/api/research-runs", { method: "POST" });
      if (!res.ok) {
        setError("Failed to start research run");
        return;
      }
      await refresh();
    } finally {
      setTriggering(false);
    }
  }

  return (
    <section className="mt-10 w-full max-w-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium">Research Runs</h2>
        <button
          onClick={runNow}
          disabled={triggering || hasActiveRun}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {triggering ? "Starting…" : hasActiveRun ? "Run in progress" : "Run now"}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 space-y-2">
        {runs.length === 0 && (
          <li className="text-sm text-muted-foreground">No research runs yet.</li>
        )}
        {runs.map((run) => (
          <li
            key={run.id}
            className="flex items-center justify-between rounded-md border px-4 py-2 text-sm"
          >
            <span>
              {run.triggeredBy === "MANUAL" ? "Manual run" : "Scheduled run"}
              {run.startedAt && (
                <span className="ml-2 text-muted-foreground">
                  {new Date(run.startedAt).toLocaleString()}
                </span>
              )}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[run.status]}`}
            >
              {run.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
