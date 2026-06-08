import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  numeric,
  boolean,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { flats } from "./flats";

export const expenseCategoryEnum = pgEnum("expense_category", [
  "groceries",
  "rent",
  "utilities",
  "internet",
  "repairs",
  "maintenance",
  "entertainment",
  "miscellaneous",
]);

export const splitTypeEnum = pgEnum("split_type", [
  "equal",
  "percentage",
  "amount",
  "custom",
]);

export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  flatId: uuid("flat_id")
    .notNull()
    .references(() => flats.id, { onDelete: "cascade" }),
  paidById: uuid("paid_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: expenseCategoryEnum("category").default("miscellaneous").notNull(),
  splitType: splitTypeEnum("split_type").default("equal").notNull(),
  receiptUrl: text("receipt_url"),
  date: timestamp("date").defaultNow().notNull(),
  isSettled: boolean("is_settled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const expenseParticipants = pgTable("expense_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  expenseId: uuid("expense_id")
    .notNull()
    .references(() => expenses.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shareAmount: numeric("share_amount", { precision: 12, scale: 2 }).notNull(),
  sharePercentage: numeric("share_percentage", { precision: 5, scale: 2 }),
  isPaid: boolean("is_paid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type ExpenseParticipant = typeof expenseParticipants.$inferSelect;
export type NewExpenseParticipant = typeof expenseParticipants.$inferInsert;
