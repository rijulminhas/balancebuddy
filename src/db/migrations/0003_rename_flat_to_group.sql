-- Rename flat_member_role enum to group_member_role
ALTER TYPE "flat_member_role" RENAME TO "group_member_role";--> statement-breakpoint

-- Rename notification_type enum value flat_invitation -> group_invitation
ALTER TYPE "notification_type" RENAME VALUE 'flat_invitation' TO 'group_invitation';--> statement-breakpoint

-- Rename tables
ALTER TABLE "flats" RENAME TO "groups";--> statement-breakpoint
ALTER TABLE "flat_members" RENAME TO "group_members";--> statement-breakpoint
ALTER TABLE "flat_history" RENAME TO "group_history";--> statement-breakpoint

-- Rename flat_id -> group_id in group_members
ALTER TABLE "group_members" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint

-- Rename columns in group_history
ALTER TABLE "group_history" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "group_history" RENAME COLUMN "flat_name" TO "group_name";--> statement-breakpoint
ALTER TABLE "group_history" RENAME COLUMN "flat_address" TO "group_address";--> statement-breakpoint

-- Rename flat_id -> group_id in all dependent tables
ALTER TABLE "expenses" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "settlements" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "chores" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "inventory_items" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "assets" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "notifications" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "messages" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "audit_logs" RENAME COLUMN "flat_id" TO "group_id";--> statement-breakpoint

-- Rename unique constraint on groups
ALTER TABLE "groups" RENAME CONSTRAINT "flats_invite_code_unique" TO "groups_invite_code_unique";--> statement-breakpoint

-- Rename FK constraints
ALTER TABLE "groups" RENAME CONSTRAINT "flats_owner_id_users_id_fk" TO "groups_owner_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "group_members" RENAME CONSTRAINT "flat_members_flat_id_flats_id_fk" TO "group_members_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "group_members" RENAME CONSTRAINT "flat_members_user_id_users_id_fk" TO "group_members_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "group_history" RENAME CONSTRAINT "flat_history_user_id_users_id_fk" TO "group_history_user_id_users_id_fk";--> statement-breakpoint
ALTER TABLE "group_history" RENAME CONSTRAINT "flat_history_flat_id_flats_id_fk" TO "group_history_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "expenses" RENAME CONSTRAINT "expenses_flat_id_flats_id_fk" TO "expenses_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "payments" RENAME CONSTRAINT "payments_flat_id_flats_id_fk" TO "payments_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "settlements" RENAME CONSTRAINT "settlements_flat_id_flats_id_fk" TO "settlements_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "chores" RENAME CONSTRAINT "chores_flat_id_flats_id_fk" TO "chores_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "inventory_items" RENAME CONSTRAINT "inventory_items_flat_id_flats_id_fk" TO "inventory_items_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "assets" RENAME CONSTRAINT "assets_flat_id_flats_id_fk" TO "assets_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "notifications" RENAME CONSTRAINT "notifications_flat_id_flats_id_fk" TO "notifications_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "messages" RENAME CONSTRAINT "messages_flat_id_flats_id_fk" TO "messages_group_id_groups_id_fk";--> statement-breakpoint
ALTER TABLE "audit_logs" RENAME CONSTRAINT "audit_logs_flat_id_flats_id_fk" TO "audit_logs_group_id_groups_id_fk";--> statement-breakpoint

-- Rename unique index
ALTER INDEX "flat_members_flat_user_uidx" RENAME TO "group_members_group_user_uidx";
