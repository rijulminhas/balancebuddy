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

export const incomeTypeEnum = pgEnum("income_type", [
  "salary",
  "freelancing",
  "business",
  "rental_income",
  "bonus",
  "other",
]);

export const personalExpenseCategoryEnum = pgEnum("personal_expense_category", [
  "food",
  "travel",
  "fuel",
  "shopping",
  "entertainment",
  "bills",
  "healthcare",
  "education",
  "family",
  "other",
]);

export const investmentTypeEnum = pgEnum("investment_type", [
  "sip",
  "mutual_fund",
  "stocks",
  "ppf",
  "fd",
  "crypto",
  "gold",
  "other",
]);

export const loanTypeEnum = pgEnum("loan_type", [
  "home_loan",
  "car_loan",
  "personal_loan",
  "education_loan",
  "credit_card_emi",
  "other",
]);

export const personalIncomes = pgTable("personal_incomes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  incomeType: incomeTypeEnum("income_type").default("salary").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const personalExpenses = pgTable("personal_expenses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: personalExpenseCategoryEnum("category").default("other").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const personalInvestments = pgTable("personal_investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  investmentName: varchar("investment_name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  investmentType: investmentTypeEnum("investment_type").default("other").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  goalName: varchar("goal_name", { length: 255 }).notNull(),
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  targetDate: timestamp("target_date"),
  notes: text("notes"),
  isCompleted: boolean("is_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  loanName: varchar("loan_name", { length: 255 }).notNull(),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  outstandingAmount: numeric("outstanding_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  emiAmount: numeric("emi_amount", { precision: 12, scale: 2 }).notNull(),
  loanType: loanTypeEnum("loan_type").default("personal_loan").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PersonalIncome = typeof personalIncomes.$inferSelect;
export type NewPersonalIncome = typeof personalIncomes.$inferInsert;
export type PersonalExpense = typeof personalExpenses.$inferSelect;
export type NewPersonalExpense = typeof personalExpenses.$inferInsert;
export type PersonalInvestment = typeof personalInvestments.$inferSelect;
export type NewPersonalInvestment = typeof personalInvestments.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
export type Loan = typeof loans.$inferSelect;
export type NewLoan = typeof loans.$inferInsert;
