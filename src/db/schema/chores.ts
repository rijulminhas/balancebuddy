import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { flats } from "./flats";

export const choreStatusEnum = pgEnum("chore_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

export const choreFrequencyEnum = pgEnum("chore_frequency", [
  "once",
  "daily",
  "weekly",
  "biweekly",
  "monthly",
]);

export const chores = pgTable("chores", {
  id: uuid("id").primaryKey().defaultRandom(),
  flatId: uuid("flat_id")
    .notNull()
    .references(() => flats.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  assignedToId: uuid("assigned_to_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  status: choreStatusEnum("status").default("pending").notNull(),
  frequency: choreFrequencyEnum("frequency").default("once").notNull(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedById: uuid("completed_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  points: integer("points").default(0),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Chore = typeof chores.$inferSelect;
export type NewChore = typeof chores.$inferInsert;
