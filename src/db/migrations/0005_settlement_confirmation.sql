-- Add awaiting_confirmation to settlement_status enum
ALTER TYPE "settlement_status" ADD VALUE 'awaiting_confirmation' BEFORE 'completed';
--> statement-breakpoint
-- Add new notification types for payment confirmation workflow
ALTER TYPE "notification_type" ADD VALUE 'payment_confirmation_required';
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'payment_confirmed';
--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE 'payment_rejected';
--> statement-breakpoint
-- Add payment detail columns to settlements
ALTER TABLE "settlements" ADD COLUMN "payment_method" text;
--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "payment_reference" text;
--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "submitted_at" timestamp;
--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "rejected_by" uuid;
--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "rejected_at" timestamp;
--> statement-breakpoint
ALTER TABLE "settlements" ADD COLUMN "rejection_reason" text;
--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
