import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const flatMemberRoleEnum = pgEnum("flat_member_role", [
  "owner",
  "admin",
  "member",
]);

export const flatMemberStatusEnum = pgEnum("flat_member_status", [
  "active",
  "invited",
  "left",
  "removed",
]);

export const flats = pgTable("flats", {
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
});

export const flatMembers = pgTable("flat_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  flatId: uuid("flat_id")
    .notNull()
    .references(() => flats.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: flatMemberRoleEnum("role").default("member").notNull(),
  status: flatMemberStatusEnum("status").default("active").notNull(),
  joinedAt: timestamp("joined_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("flat_members_flat_user_uidx").on(t.flatId, t.userId)]);

export type Flat = typeof flats.$inferSelect;
export type NewFlat = typeof flats.$inferInsert;
export type FlatMember = typeof flatMembers.$inferSelect;
export type NewFlatMember = typeof flatMembers.$inferInsert;
