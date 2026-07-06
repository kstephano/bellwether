"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ResearchRunView = {
  id: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  triggeredBy: "CRON" | "MANUAL";
  startedAt: string | null;
  completedAt: string | null;
};

const STATUS_LABELS: Record<ResearchRunView["status"], string> = {
  PENDING: "Pending",
  RUNNING: "Running",
  COMPLETED: "Completed",
  FAILED: "Failed",
};

const STATUS_TEXT: Record<ResearchRunView["status"], string> = {
  PENDING: "text-muted-foreground",
  RUNNING: "text-foreground",
  COMPLETED: "text-moss",
  FAILED: "text-destructive",
};

const STATUS_DOT: Record<ResearchRunView["status"], string> = {
  PENDING: "bg-muted-foreground/40",
  RUNNING: "bg-foreground animate-pulse",
  COMPLETED: "bg-moss",
  FAILED: "bg-destructive",
};

function StatusMark({ status }: { status: ResearchRunView["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
        STATUS_TEXT[status]
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function latestRunLede(run: ResearchRunView | undefined): string {
  if (!run) return "No Research Runs yet — run one to receive your first Report.";
  switch (run.status) {
    case "PENDING":
      return "A Research Run is queued and will begin shortly.";
    case "RUNNING":
      return "A Research Run is in progress across your configured targets.";
    case "COMPLETED":
      return "The latest Research Run completed. Reports are ready to read.";
    case "FAILED":
      return "The latest Research Run failed. You can trigger another at any time.";
  }
}

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

  const [latest, ...earlier] = runs;

  return (
    <section aria-labelledby="research-runs-heading">
      <div className="flex items-baseline justify-between border-b-2 border-foreground pb-2">
        <h2 id="research-runs-heading" className="kicker text-foreground">
          Research Runs
        </h2>
        <Button onClick={runNow} disabled={triggering || hasActiveRun} size="sm">
          {triggering ? "Starting…" : hasActiveRun ? "Run in progress" : "Run now"}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="border-b py-6">
        <p className="font-heading text-2xl leading-snug italic">
          {latestRunLede(latest)}
        </p>
        {latest && (
          <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <StatusMark status={latest.status} />
            <span className="font-mono text-xs text-muted-foreground" suppressHydrationWarning>
              {latest.triggeredBy === "MANUAL" ? "Manual" : "Scheduled"}
              {latest.startedAt && ` · started ${formatWhen(latest.startedAt)}`}
              {latest.completedAt && ` · finished ${formatWhen(latest.completedAt)}`}
            </span>
          </div>
        )}
      </div>

      {earlier.length > 0 && (
        <ul>
          {earlier.map((run) => (
            <li
              key={run.id}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b py-3"
            >
              <span className="text-sm">
                {run.triggeredBy === "MANUAL" ? "Manual run" : "Scheduled run"}
                {run.startedAt && (
                  <span
                    className="ml-3 font-mono text-xs text-muted-foreground"
                    suppressHydrationWarning
                  >
                    {formatWhen(run.startedAt)}
                  </span>
                )}
              </span>
              <StatusMark status={run.status} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
