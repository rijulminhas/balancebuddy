import { pgTable, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { groups } from "./groups";
import { users } from "./users";

// Tracks how far each member has read the group chat.
// A message is "seen" by a member when their lastReadAt >= message.createdAt.
export const chatReadState = pgTable(
  "chat_read_state",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // timestamptz across the board: last_read_at is a client-supplied absolute instant
    // (written from a JS Date across timezones) and must round-trip as an instant, not
    // wall-clock time; created_at/updated_at match for a consistent, tz-aware table.
    lastReadAt: timestamp("last_read_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.groupId, t.userId)],
);

export type ChatReadState = typeof chatReadState.$inferSelect;
export type NewChatReadState = typeof chatReadState.$inferInsert;
