import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  numeric,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { flats } from "./flats";

export const assetConditionEnum = pgEnum("asset_condition", [
  "excellent",
  "good",
  "fair",
  "poor",
]);

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  flatId: uuid("flat_id")
    .notNull()
    .references(() => flats.id, { onDelete: "cascade" }),
  ownedById: uuid("owned_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  addedById: uuid("added_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }),
  currentValue: numeric("current_value", { precision: 12, scale: 2 }),
  purchaseDate: timestamp("purchase_date"),
  condition: assetConditionEnum("condition").default("good"),
  imageUrl: text("image_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
