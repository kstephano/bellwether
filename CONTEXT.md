# Bellwether

A personal AI research tool that monitors a configured set of technologies and produces a monthly structured report of changes, advisories, and strategic developments.

## Language

### Research Configuration

**Stack Entry**: A user-configured research target consisting of a category, a technology name, and an optional version pin. The fundamental unit of research.
_Avoid_: Tech stack, technology, item

**Category**: A classification label for a Stack Entry. Seven defaults exist (Front End, Back End, Infrastructure, AI, Environment, Data Platform, Security); the user may define additional custom categories.
_Avoid_: Tag, group, type

**Free-text Topic**: A research target that is either an uncategorised technology or a standalone research subject not tied to any category. Treated identically to a Stack Entry for report purposes.
_Avoid_: Custom topic, extra topic, free-form entry

**Source**: A data feed the research agent pulls from. May be curated (GitHub releases, NVD/CVE feeds, official changelogs) or user-defined (RSS feeds, URLs, GitHub repositories).
_Avoid_: Feed, input, data source

### Reporting

**Research Run**: A single execution of the research agent across all configured Stack Entries and Free-text Topics. Triggered either by monthly cron or manually. Produces exactly one Report.
_Avoid_: Job, task, crawl, batch

**Report**: The structured output of a Research Run. Contains four fixed sections — Change Digest, Current State, Threats & Opportunities, and Security Advisories — preceded by a Delta Section.
_Avoid_: Finding, result, output, summary

**Delta Section**: The opening section of a Report summarising what changed compared to the previous month's Report. Designed for 30-second triage before reading the full Report.
_Avoid_: Diff, comparison, change summary

**Change Digest**: The section within a Report listing new versions, deprecations, and breaking changes published during the reporting period.
_Avoid_: Changelog, release notes

**Current State**: The section within a Report capturing the evergreen snapshot of recommended patterns, known gotchas, and maturity level for a Stack Entry at the time of the Research Run.
_Avoid_: Best practices, overview, summary

**Strategic Outlook**: The section within a Report identifying emerging alternatives, risks to current technology choices, and adoption opportunities worth evaluating.
_Avoid_: Threats and opportunities, watch list, strategic analysis

**Security Advisories**: The section within a Report surfacing known vulnerabilities, CVEs, and security-relevant changes in monitored technologies.
_Avoid_: CVE list, vulnerability report, security findings
