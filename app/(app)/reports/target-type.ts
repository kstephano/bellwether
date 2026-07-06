// URL segment ↔ domain target type. Segments are IA labels only; the
// domain terms remain Stack Entry and Free-text Topic (CONTEXT.md).
const SEGMENT_TO_TYPE = {
  "stack-entry": "STACK_ENTRY",
  topic: "FREE_TEXT_TOPIC",
} as const;

export type TargetType = (typeof SEGMENT_TO_TYPE)[keyof typeof SEGMENT_TO_TYPE];

export function targetTypeFromSegment(segment: string): TargetType | null {
  return SEGMENT_TO_TYPE[segment as keyof typeof SEGMENT_TO_TYPE] ?? null;
}

export function segmentFromTargetType(targetType: TargetType): string {
  return targetType === "STACK_ENTRY" ? "stack-entry" : "topic";
}

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  STACK_ENTRY: "Stack Entry",
  FREE_TEXT_TOPIC: "Free-text Topic",
};

export function formatReportDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
