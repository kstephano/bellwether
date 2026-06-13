# Trigger.dev for background Research Runs

A Research Run spans multiple steps — web search, feed parsing, and AI synthesis per Stack Entry — and can take several minutes end-to-end. Vercel serverless functions cap at 5 minutes on Pro and provide no per-step retry or observability for long-running work. We use Trigger.dev to execute Research Runs as durable, multi-step background jobs: each step has its own timeout, failures are retryable, and the same job definition handles both the monthly cron trigger and manual "Run now" invocations from the UI.

## Considered Options

- **Vercel Cron + chained serverless functions** — Hits the timeout ceiling immediately for large stack configurations. Retry logic would need to be hand-rolled.
- **Separate background worker (Railway/Fly.io)** — Clean separation but adds a second deployment target and infrastructure to maintain for a personal tool.
