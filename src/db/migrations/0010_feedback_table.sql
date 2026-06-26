CREATE TYPE "public"."feedback_type" AS ENUM('feedback', 'feature_request', 'bug_report', 'general_suggestion');
--> statement-breakpoint
CREATE TYPE "public"."feedback_status" AS ENUM('NEW', 'REVIEWED', 'PUBLISHED', 'ARCHIVED');
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_name" varchar(255) NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"type" "feedback_type" NOT NULL,
	"rating" integer,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" "feedback_status" DEFAULT 'NEW' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"allow_public_display" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" ("status");
--> statement-breakpoint
CREATE INDEX "feedback_type_idx" ON "feedback" ("type");
--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" ("user_id");
--> statement-breakpoint
CREATE INDEX "feedback_is_published_idx" ON "feedback" ("is_published");
--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" ("created_at");
