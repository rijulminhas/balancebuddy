import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  uniqueIndex,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const groupMemberRoleEnum = pgEnum("group_member_role", [
  "owner",
  "admin",
  "member",
]);

export const groupMemberStatusEnum = pgEnum("group_member_status", [
  "active",
  "invited",
  "left",
  "removed",
]);

export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  inviteCode: varchar("invite_code", { length: 20 }).notNull().unique(),
  maxMembers: integer("max_members").default(10),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const groupMembers = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: groupMemberRoleEnum("role").default("member").notNull(),
  status: groupMemberStatusEnum("status").default("active").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  removedReason: text("removed_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("group_members_group_user_uidx").on(t.groupId, t.userId)]);

export const groupHistory = pgTable("group_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "restrict" }),
  groupName: varchar("group_name", { length: 255 }).notNull(),
  groupAddress: text("group_address"),
  role: groupMemberRoleEnum("role").notNull(),
  leftAt: timestamp("left_at").defaultNow().notNull(),
  deletedByOwner: boolean("deleted_by_owner").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  inviteCode: varchar("invite_code", { length: 20 }).notNull(),
});

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;
export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;
export type GroupHistory = typeof groupHistory.$inferSelect;
export type NewGroupHistory = typeof groupHistory.$inferInsert;
