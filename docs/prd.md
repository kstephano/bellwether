# PRD: Bellwether — AI-powered monthly tech stack research application

> Publish this to GitHub Issues with the `ready-for-agent` label when ready.

## Problem Statement

Staying current with a personally curated set of technologies spanning multiple domains (frontend, backend, infrastructure, AI, data platforms, security) is time-consuming and inconsistent. Manually tracking changelogs, CVEs, deprecations, and strategic shifts across 8+ technologies requires visiting multiple sources on an ad-hoc basis, is easy to neglect, and produces no persistent record of how the landscape has changed over time.

## Solution

Bellwether is a personal AI research application that automatically triggers a Research Run once a month across all configured Stack Entries and Free-text Topics. Each Research Run produces a structured Report per entry, containing:

- A **Delta Section** (what changed since last month — designed for 30-second triage)
- A **Change Digest** (new versions, deprecations, breaking changes)
- A **Current State** snapshot (evergreen best practices and known gotchas)
- A **Strategic Outlook** (emerging alternatives, risks, and adoption opportunities)
- **Security Advisories** (CVEs and security-relevant changes)

The user receives an email notification when the Research Run completes, views the full Report in the app, and can export any Report as Markdown. Research Runs can also be triggered manually from the dashboard.

All Reports and Stack Entries are private to the authenticated user and are never shared or made public.

## User Stories

### Authentication

1. As a user, I want to log in with my Google account, so that my Stack Entries and Reports are protected from public access.
2. As a user, I want all unauthenticated requests to be rejected, so that no data is accessible without a valid session.

### Stack Configuration

3. As a user, I want to create a Stack Entry with a category, technology name, and optional version pin, so that Bellwether researches the specific technologies in my stack.
4. As a user, I want to choose from seven default categories (Front End, Back End, Infrastructure, AI, Environment, Data Platform, Security) when creating a Stack Entry, so that I can quickly classify entries without defining my own taxonomy.
5. As a user, I want to create custom categories beyond the seven defaults, so that I can classify Stack Entries that don't fit the standard taxonomy.
6. As a user, I want to optionally pin a version to a Stack Entry (e.g. "React 18.3"), so that the Change Digest focuses on changes relevant to my current version rather than the latest.
7. As a user, I want to edit a Stack Entry's technology name, version, or category at any time, so that my configuration reflects my current stack.
8. As a user, I want to delete a Stack Entry, so that I can stop receiving Reports for technologies I no longer use.
9. As a user, I want to add a Free-text Topic that is not tied to any category, so that I can track uncategorised technologies or standalone research subjects outside the structured stack.
10. As a user, I want to edit or delete a Free-text Topic at any time, so that my research scope stays relevant.
11. As a user, I want to see a warning when entering text into a Free-text Topic field, reminding me not to include proprietary names, internal endpoints, or confidential project details, so that I don't inadvertently send sensitive information to third-party APIs.

### Sources

12. As a user, I want Bellwether to pull from curated sources by default (GitHub Releases, NVD/CVE feeds, official changelogs), so that I receive reliable structured data without configuration.
13. As a user, I want to add user-defined Sources (RSS feeds, URLs, GitHub repositories) to any Stack Entry or Free-text Topic, so that the Research Run supplements curated feeds with sources I know are authoritative for that technology.
14. As a user, I want to remove a user-defined Source from a Stack Entry, so that outdated or irrelevant sources are no longer included.

### Research Runs

15. As a user, I want Bellwether to automatically trigger a Research Run once a month, so that I receive updated Reports without having to initiate them manually.
16. As a user, I want to manually trigger a Research Run from the dashboard at any time, so that I get an immediate Report when I add a new Stack Entry or when a major release drops mid-cycle.
17. As a user, I want to see the status of an in-progress Research Run (pending, running, completed, failed) in the dashboard, so that I know the job is running and can monitor progress.
18. As a user, I want to receive an email notification when a Research Run completes, so that I know new Reports are ready without having to check the app.
19. As a user, I want the notification email subject to summarise the most urgent findings (e.g. "3 Security Advisories found this month"), so that I can triage urgency without opening the app.
20. As a user, I want failed Research Runs to surface an error state in the dashboard, so that I know something went wrong and can re-trigger.

### Reports

21. As a user, I want each Report to open with a Delta Section summarising what changed since the previous month's Report for that Stack Entry, so that I can triage in 30 seconds before reading the full Report.
22. As a user, I want the Change Digest section to list new versions, deprecations, and breaking changes for a Stack Entry during the reporting period, so that I stay current with release cadence.
23. As a user, I want the Current State section to capture the evergreen snapshot of recommended patterns and known gotchas for a Stack Entry, so that I have a reference point for best practices at the time of the Research Run.
24. As a user, I want the Strategic Outlook section to surface emerging alternatives, risks to my current technology choices, and adoption opportunities, so that I can make informed architectural decisions.
25. As a user, I want the Security Advisories section to surface CVEs and security-relevant changes for a Stack Entry, so that I can act on vulnerabilities promptly.
26. As a user, I want to browse the full history of past Reports in the app, organised by Stack Entry and date, so that I can track how my stack has evolved over time.
27. As a user, I want to export any Report as Markdown, so that I can paste findings into Notion, Obsidian, or share them with colleagues.

### Privacy & Audit

28. As a user, I want all my Reports and Stack Entries to be strictly private to my account, so that my technology choices are not visible to anyone else.
29. As a user, I want the app to log what data is sent to third-party APIs (Tavily, Anthropic), so that I have an audit trail if I need to verify what information left the system.

## Implementation Decisions

### Tech Stack

- **Framework:** Next.js 15 (App Router), hosted on Vercel
- **Auth:** Auth.js v5 with Google OAuth provider. Single authenticated user — Google Auth acts as an access lock, not a multi-user system.
- **UI:** shadcn/ui + Tailwind CSS
- **ORM + Database:** Drizzle ORM + Neon (serverless Postgres)
- **Background jobs:** Trigger.dev — Research Runs execute as durable, multi-step background jobs with per-step timeouts and retry logic. The same job definition handles both the monthly cron trigger and the manual "Run now" invocation from the UI. See ADR-0001.
- **AI synthesis:** Claude Sonnet 4.6 (Anthropic) — long context, strong structured output, used for synthesising raw source content into the four Report sections.
- **Web search:** Tavily — purpose-built for AI agent pipelines, returns LLM-ready structured content.
- **Email:** Resend — sends notification email on Research Run completion.

### Data Model

- **Category:** id, name, isDefault (bool), createdAt
- **Stack Entry:** id, categoryId, technology, version (nullable), createdAt, updatedAt
- **Free-text Topic:** id, text, type (UNCATEGORISED_TECH | STANDALONE_TOPIC), createdAt, updatedAt
- **Source:** id, targetId, targetType (STACK_ENTRY | FREE_TEXT_TOPIC), type (RSS | URL | GITHUB_REPO), url, createdAt
- **Research Run:** id, status (PENDING | RUNNING | COMPLETED | FAILED), triggeredBy (CRON | MANUAL), startedAt, completedAt
- **Report:** id, researchRunId, targetId, targetType (STACK_ENTRY | FREE_TEXT_TOPIC), deltaSection (JSON), changeDigest (JSON), currentState (JSON), strategicOutlook (JSON), securityAdvisories (JSON), createdAt

### Key Behaviours

- Reports are scoped strictly to the authenticated user — no cross-user visibility. The data model does not implement multi-tenancy. See ADR-0002.
- The Free-text Topic input renders a persistent UI warning: *"Topics are sent to third-party APIs (Tavily, Anthropic). Do not include proprietary names, internal endpoints, or confidential project details."*
- Each Research Run produces one Report per Stack Entry and one Report per Free-text Topic.
- The Delta Section is computed by diffing the current Report's structured JSON against the most recent previous Report for the same target. If no previous Report exists (first run), the Delta Section is omitted.
- Curated sources are always included per Research Run. User-defined Sources are fetched in addition to curated sources for the relevant Stack Entry or Free-text Topic.
- A Research Run that fails mid-way records partial Reports for completed targets; the run status is set to FAILED.

### Report Generation Pipeline (per target)

1. Fetch curated sources (GitHub Releases API, NVD/CVE feed, official changelog)
2. Fetch user-defined Sources (RSS, URL, GitHub repo)
3. Web search via Tavily
4. Synthesise all raw content into four sections via Claude Sonnet 4.6
5. Compute Delta Section against previous Report (if one exists)
6. Persist Report to Neon
7. Log all data sent to third-party APIs

## Testing Decisions

Good tests verify external behaviour — what the system produces given certain inputs — not internal implementation details like which function was called or how data was transformed internally.

### Seams

1. **Research Run (integration):** Mock Tavily, Anthropic, and NVD. Provide a stack configuration. Assert the resulting Report contains all four sections with non-empty content, and that the Delta Section is present when a previous Report exists.

2. **Delta Section computation (unit):** Pure function. Given two consecutive Report JSON payloads for the same Stack Entry, assert the Delta Section correctly identifies additions, removals, and changes between them.

3. **Markdown export (unit):** Pure function. Given a Report, assert the Markdown output contains all four section headings and non-empty content for each.

4. **API route auth protection (integration):** Assert all API routes return 401 when called without a valid Google session. Assert the "Run now" endpoint enqueues a Trigger.dev job and returns 202 when called with a valid session.

5. **DB repository (integration):** Against a Neon test branch. Assert Stack Entry CRUD, Report persistence, and "fetch latest Report for target" queries return correct results.

## Out of Scope

- Multi-user access or multi-tenancy — Bellwether is a single-user personal tool
- PDF export — Markdown export covers the sharing use case
- Push notifications (browser or mobile)
- Public sharing or publishing of Reports
- Slack, webhook, or third-party integrations
- External REST or GraphQL API
- Mobile application
- AI-powered stack recommendations ("you should switch from X to Y")
- Scheduled Research Runs at intervals other than monthly

## Further Notes

- Canonical domain vocabulary is defined in `CONTEXT.md`. Use glossary terms throughout implementation — do not drift to synonyms listed under _Avoid_.
- Two ADRs are already recorded in `docs/adr/`:
  - `0001-trigger-dev-for-research-runs.md` — why Trigger.dev over Vercel Cron or a separate worker
  - `0002-reports-are-never-shared.md` — why Reports are strictly private, and the free-text topic warning requirement
- When publishing to GitHub Issues, apply the `ready-for-agent` label.
