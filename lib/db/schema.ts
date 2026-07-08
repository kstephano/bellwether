import {
  pgTable,
  text,
  boolean,
  timestamp,
  pgEnum,
  json,
  integer,
} from "drizzle-orm/pg-core";

export const sourceTypeEnum = pgEnum("source_type", [
  "RSS",
  "URL",
  "GITHUB_REPO",
]);

export const sourceTargetTypeEnum = pgEnum("source_target_type", [
  "STACK_ENTRY",
  "FREE_TEXT_TOPIC",
]);

export const freetextTopicTypeEnum = pgEnum("freetext_topic_type", [
  "UNCATEGORISED_TECH",
  "STANDALONE_TOPIC",
]);

export const categories = pgTable("categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const stackEntries = pgTable("stack_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  technology: text("technology").notNull(),
  version: text("version"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sources = pgTable("sources", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  targetId: text("target_id").notNull(),
  targetType: sourceTargetTypeEnum("target_type").notNull(),
  type: sourceTypeEnum("type").notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const researchRunStatusEnum = pgEnum("research_run_status", [
  "PENDING",
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);

export const researchRunTriggerEnum = pgEnum("research_run_trigger", [
  "CRON",
  "MANUAL",
]);

export const auditServiceEnum = pgEnum("audit_service", [
  "TAVILY",
  "ANTHROPIC",
]);

export const reportTargetTypeEnum = pgEnum("report_target_type", [
  "STACK_ENTRY",
  "FREE_TEXT_TOPIC",
]);

export const researchRuns = pgTable("research_runs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  status: researchRunStatusEnum("status").notNull().default("PENDING"),
  triggeredBy: researchRunTriggerEnum("triggered_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const reports = pgTable("reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  researchRunId: text("research_run_id")
    .notNull()
    .references(() => researchRuns.id),
  targetId: text("target_id").notNull(),
  targetType: reportTargetTypeEnum("target_type").notNull(),
  deltaSection: json("delta_section"),
  changeDigest: json("change_digest").notNull(),
  currentState: json("current_state").notNull(),
  strategicOutlook: json("strategic_outlook").notNull(),
  securityAdvisories: json("security_advisories").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  researchRunId: text("research_run_id")
    .notNull()
    .references(() => researchRuns.id),
  service: auditServiceEnum("service").notNull(),
  characterCount: integer("character_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const freetextTopics = pgTable("freetext_topics", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  type: freetextTopicTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
