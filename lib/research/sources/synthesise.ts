// Synthesis client: turns raw research text into structured ReportSections
// using Claude Sonnet 4.6 with a forced tool call, which guarantees the output
// matches the ReportSections shape. Used by the research pipeline as the
// `synthesise` client.

import Anthropic from "@anthropic-ai/sdk";
import type { ReportSections } from "../types";

const REPORT_TOOL = {
  name: "emit_report",
  description: "Emit the structured research report for a technology.",
  input_schema: {
    type: "object" as const,
    properties: {
      changeDigest: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: { description: { type: "string" } },
              required: ["description"],
            },
          },
        },
        required: ["items"],
      },
      currentState: {
        type: "object",
        properties: {
          summary: { type: "string" },
          gotchas: { type: "array", items: { type: "string" } },
        },
        required: ["summary", "gotchas"],
      },
      strategicOutlook: {
        type: "object",
        properties: {
          risks: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
        },
        required: ["risks", "opportunities"],
      },
      securityAdvisories: {
        type: "object",
        properties: {
          advisories: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                summary: { type: "string" },
              },
              required: ["id", "summary"],
            },
          },
        },
        required: ["advisories"],
      },
    },
    required: ["changeDigest", "currentState", "strategicOutlook", "securityAdvisories"],
  },
};

export async function synthesise(raw: string): Promise<ReportSections> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    tools: [REPORT_TOOL],
    tool_choice: { type: "tool", name: REPORT_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Synthesise the following research into a structured report. Base every section only on the material provided.\n\n${raw}`,
      },
    ],
  });

  const toolUse = message.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a report tool call");
  }

  return toolUse.input as ReportSections;
}
