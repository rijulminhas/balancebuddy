CREATE INDEX IF NOT EXISTS "audit_logs_group_created_idx" ON "audit_logs" ("group_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "group_members_user_status_idx" ON "group_members" ("user_id","status");
