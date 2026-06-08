import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { flats } from "./flats";

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "system",
  "expense_update",
  "chore_update",
  "settlement_update",
]);

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  flatId: uuid("flat_id")
    .notNull()
    .references(() => flats.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").references(() => users.id, {
    onDelete: "set null",
  }),
  type: messageTypeEnum("type").default("text").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
