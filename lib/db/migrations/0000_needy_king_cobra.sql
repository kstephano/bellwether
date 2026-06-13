CREATE TYPE "public"."audit_service" AS ENUM('TAVILY', 'ANTHROPIC');--> statement-breakpoint
CREATE TYPE "public"."freetext_topic_type" AS ENUM('UNCATEGORISED_TECH', 'STANDALONE_TOPIC');--> statement-breakpoint
CREATE TYPE "public"."report_target_type" AS ENUM('STACK_ENTRY', 'FREE_TEXT_TOPIC');--> statement-breakpoint
CREATE TYPE "public"."research_run_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."research_run_trigger" AS ENUM('CRON', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."source_target_type" AS ENUM('STACK_ENTRY', 'FREE_TEXT_TOPIC');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('RSS', 'URL', 'GITHUB_REPO');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"research_run_id" text NOT NULL,
	"service" "audit_service" NOT NULL,
	"character_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freetext_topics" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"text" text NOT NULL,
	"type" "freetext_topic_type" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"research_run_id" text NOT NULL,
	"target_id" text NOT NULL,
	"target_type" "report_target_type" NOT NULL,
	"delta_section" json,
	"change_digest" json NOT NULL,
	"current_state" json NOT NULL,
	"strategic_outlook" json NOT NULL,
	"security_advisories" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "research_run_status" DEFAULT 'PENDING' NOT NULL,
	"triggered_by" "research_run_trigger" NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"target_id" text NOT NULL,
	"target_type" "source_target_type" NOT NULL,
	"type" "source_type" NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stack_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text NOT NULL,
	"technology" text NOT NULL,
	"version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_research_run_id_research_runs_id_fk" FOREIGN KEY ("research_run_id") REFERENCES "public"."research_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_research_run_id_research_runs_id_fk" FOREIGN KEY ("research_run_id") REFERENCES "public"."research_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stack_entries" ADD CONSTRAINT "stack_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;