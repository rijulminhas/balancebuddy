import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  numeric,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { groups } from "./groups";

export const inventoryCategoryEnum = pgEnum("inventory_category", [
  "groceries",
  "cleaning",
  "toiletries",
  "kitchen",
  "household",
  "other",
]);

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  addedById: uuid("added_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: inventoryCategoryEnum("category").default("other").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull().default("0"),
  unit: varchar("unit", { length: 50 }),
  minQuantity: numeric("min_quantity", { precision: 10, scale: 2 }),
  lowStockAlert: boolean("low_stock_alert").default(true).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
