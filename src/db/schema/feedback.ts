import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "feedback",
  "feature_request",
  "bug_report",
  "general_suggestion",
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "NEW",
  "REVIEWED",
  "PUBLISHED",
  "ARCHIVED",
]);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userName: varchar("user_name", { length: 255 }).notNull(),
    userEmail: varchar("user_email", { length: 255 }).notNull(),
    type: feedbackTypeEnum("type").notNull(),
    rating: integer("rating"),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    status: feedbackStatusEnum("status").default("NEW").notNull(),
    isPublished: boolean("is_published").default(false).notNull(),
    allowPublicDisplay: boolean("allow_public_display").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("feedback_status_idx").on(table.status),
    index("feedback_type_idx").on(table.type),
    index("feedback_user_id_idx").on(table.userId),
    index("feedback_is_published_idx").on(table.isPublished),
    index("feedback_created_at_idx").on(table.createdAt),
  ]
);

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
