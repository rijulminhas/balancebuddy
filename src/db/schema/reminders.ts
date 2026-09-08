import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  numeric,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";

export const reminderTypeEnum = pgEnum("reminder_type", [
  "rent",
  "emi",
  "electricity",
  "water",
  "internet",
  "subscription",
  "custom",
]);

export const reminderFrequencyEnum = pgEnum("reminder_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
  "one_time",
]);

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  type: reminderTypeEnum("type").default("custom").notNull(),
  frequency: reminderFrequencyEnum("frequency").default("monthly").notNull(),
  // For monthly/yearly: day in month (1–31)
  dayOfMonth: integer("day_of_month"),
  // For yearly: month number (1–12)
  monthOfYear: integer("month_of_year"),
  // For weekly: day of week (0 = Sunday … 6 = Saturday)
  dayOfWeek: integer("day_of_week"),
  // For one_time: the exact due date
  specificDate: timestamp("specific_date"),
  // How many days before the due date to send the push notification (default 1 = 24 h)
  reminderDaysBefore: integer("reminder_days_before").default(1).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastNotifiedAt: timestamp("last_notified_at"),
  nextNotifyAt: timestamp("next_notify_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
