import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";

export const monthlyEssentials = pgTable("monthly_essentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  category: varchar("category", { length: 100 }).notNull().default("Groceries"),
  notes: text("notes"),
  isArchived: boolean("is_archived").default(false).notNull(),
  addedCount: integer("added_count").default(0).notNull(),
  lastAddedToShoppingAt: timestamp("last_added_to_shopping_at"),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shoppingItems = pgTable("shopping_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }),
  unit: varchar("unit", { length: 50 }),
  category: varchar("category", { length: 100 }).notNull().default("Groceries"),
  notes: text("notes"),
  isPurchased: boolean("is_purchased").default(false).notNull(),
  addedById: uuid("added_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  sourceEssentialId: uuid("source_essential_id").references(
    () => monthlyEssentials.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MonthlyEssential = typeof monthlyEssentials.$inferSelect;
export type NewMonthlyEssential = typeof monthlyEssentials.$inferInsert;
export type ShoppingItem = typeof shoppingItems.$inferSelect;
export type NewShoppingItem = typeof shoppingItems.$inferInsert;
