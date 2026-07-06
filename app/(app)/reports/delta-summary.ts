import type { DeltaSection } from "@/lib/research/types";

export function deltaSummary(delta: DeltaSection | null): string {
  if (!delta) return "First Report for this target";
  const parts: string[] = [];
  if (delta.newAdvisories.length > 0) {
    parts.push(
      `${delta.newAdvisories.length} new ${delta.newAdvisories.length === 1 ? "advisory" : "advisories"}`
    );
  }
  if (delta.resolvedAdvisories.length > 0) {
    parts.push(`${delta.resolvedAdvisories.length} resolved`);
  }
  if (delta.newChanges.length > 0) {
    parts.push(
      `${delta.newChanges.length} new ${delta.newChanges.length === 1 ? "change" : "changes"}`
    );
  }
  return parts.length > 0 ? parts.join(" · ") : "No changes since the previous Report";
}
