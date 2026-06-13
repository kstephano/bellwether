import type { ReportSections, DeltaSection } from "./types";

export function computeDeltaSection(
  current: ReportSections,
  previous: ReportSections | null
): DeltaSection | null {
  if (!previous) return null;

  const prevAdvisoryIds = new Set(previous.securityAdvisories.advisories.map((a) => a.id));
  const currAdvisoryIds = new Set(current.securityAdvisories.advisories.map((a) => a.id));

  const newAdvisories = current.securityAdvisories.advisories.filter(
    (a) => !prevAdvisoryIds.has(a.id)
  );
  const resolvedAdvisories = previous.securityAdvisories.advisories.filter(
    (a) => !currAdvisoryIds.has(a.id)
  );

  const prevChanges = new Set(previous.changeDigest.items.map((i) => i.description));
  const newChanges = current.changeDigest.items.filter(
    (i) => !prevChanges.has(i.description)
  );

  return { newAdvisories, resolvedAdvisories, newChanges };
}
