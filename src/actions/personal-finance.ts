"use server";

import { db } from "@/db";
import {
  personalIncomes,
  personalExpenses,
  personalInvestments,
  savingsGoals,
  loans,
} from "@/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";

// ─── Income Actions ───────────────────────────────────────────────────────────

const incomeSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  amount: z.number().positive("Amount must be positive"),
  incomeType: z.enum([
    "salary",
    "freelancing",
    "business",
    "rental_income",
    "bonus",
    "other",
  ]),
  date: z.string(),
  notes: z.string().max(1000).optional(),
});

export type IncomeInput = z.infer<typeof incomeSchema>;

export async function createIncome(
  userId: string,
  input: IncomeInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = incomeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { title, amount, incomeType, date, notes } = parsed.data;

  const [record] = await db
    .insert(personalIncomes)
    .values({
      userId,
      title,
      amount: String(amount),
      incomeType,
      date: new Date(date),
      notes,
    })
    .returning({ id: personalIncomes.id });

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/income");
  return { success: true, data: { id: record.id } };
}

export async function updateIncome(
  userId: string,
  incomeId: string,
  input: IncomeInput
): Promise<ActionResult> {
  const parsed = incomeSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [existing] = await db
    .select({ id: personalIncomes.id })
    .from(personalIncomes)
    .where(
      and(eq(personalIncomes.id, incomeId), eq(personalIncomes.userId, userId))
    )
    .limit(1);

  if (!existing) return { success: false, error: "Income record not found" };

  const { title, amount, incomeType, date, notes } = parsed.data;

  await db
    .update(personalIncomes)
    .set({
      title,
      amount: String(amount),
      incomeType,
      date: new Date(date),
      notes,
      updatedAt: new Date(),
    })
    .where(eq(personalIncomes.id, incomeId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/income");
  return { success: true };
}

export async function deleteIncome(
  userId: string,
  incomeId: string
): Promise<ActionResult> {
  const [existing] = await db
    .select({ id: personalIncomes.id })
    .from(personalIncomes)
    .where(
      and(eq(personalIncomes.id, incomeId), eq(personalIncomes.userId, userId))
    )
    .limit(1);

  if (!existing) return { success: false, error: "Income record not found" };

  await db.delete(personalIncomes).where(eq(personalIncomes.id, incomeId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/income");
  return { success: true };
}

// ─── Personal Expense Actions ──────────────────────────────────────────────────

const personalExpenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum([
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
  ]),
  date: z.string(),
  notes: z.string().max(1000).optional(),
});

export type PersonalExpenseInput = z.infer<typeof personalExpenseSchema>;

export async function createPersonalExpense(
  userId: string,
  input: PersonalExpenseInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = personalExpenseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { title, amount, category, date, notes } = parsed.data;

  const [record] = await db
    .insert(personalExpenses)
    .values({
      userId,
      title,
      amount: String(amount),
      category,
      date: new Date(date),
      notes,
    })
    .returning({ id: personalExpenses.id });

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/expenses");
  return { success: true, data: { id: record.id } };
}

export async function updatePersonalExpense(
  userId: string,
  expenseId: string,
  input: PersonalExpenseInput
): Promise<ActionResult> {
  const parsed = personalExpenseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [existing] = await db
    .select({ id: personalExpenses.id })
    .from(personalExpenses)
    .where(
      and(
        eq(personalExpenses.id, expenseId),
        eq(personalExpenses.userId, userId)
      )
    )
    .limit(1);

  if (!existing) return { success: false, error: "Expense record not found" };

  const { title, amount, category, date, notes } = parsed.data;

  await db
    .update(personalExpenses)
    .set({
      title,
      amount: String(amount),
      category,
      date: new Date(date),
      notes,
      updatedAt: new Date(),
    })
    .where(eq(personalExpenses.id, expenseId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/expenses");
  return { success: true };
}

export async function deletePersonalExpense(
  userId: string,
  expenseId: string
): Promise<ActionResult> {
  const [existing] = await db
    .select({ id: personalExpenses.id })
    .from(personalExpenses)
    .where(
      and(
        eq(personalExpenses.id, expenseId),
        eq(personalExpenses.userId, userId)
      )
    )
    .limit(1);

  if (!existing) return { success: false, error: "Expense record not found" };

  await db
    .delete(personalExpenses)
    .where(eq(personalExpenses.id, expenseId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/expenses");
  return { success: true };
}

// ─── Investment Actions ────────────────────────────────────────────────────────

const investmentSchema = z.object({
  investmentName: z.string().min(1, "Name is required").max(255),
  amount: z.number().positive("Amount must be positive"),
  investmentType: z.enum([
    "sip",
    "mutual_fund",
    "stocks",
    "ppf",
    "fd",
    "crypto",
    "gold",
    "other",
  ]),
  date: z.string(),
  notes: z.string().max(1000).optional(),
});

export type InvestmentInput = z.infer<typeof investmentSchema>;

export async function createInvestment(
  userId: string,
  input: InvestmentInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = investmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { investmentName, amount, investmentType, date, notes } = parsed.data;

  const [record] = await db
    .insert(personalInvestments)
    .values({
      userId,
      investmentName,
      amount: String(amount),
      investmentType,
      date: new Date(date),
      notes,
    })
    .returning({ id: personalInvestments.id });

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/investments");
  return { success: true, data: { id: record.id } };
}

export async function updateInvestment(
  userId: string,
  investmentId: string,
  input: InvestmentInput
): Promise<ActionResult> {
  const parsed = investmentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [existing] = await db
    .select({ id: personalInvestments.id })
    .from(personalInvestments)
    .where(
      and(
        eq(personalInvestments.id, investmentId),
        eq(personalInvestments.userId, userId)
      )
    )
    .limit(1);

  if (!existing)
    return { success: false, error: "Investment record not found" };

  const { investmentName, amount, investmentType, date, notes } = parsed.data;

  await db
    .update(personalInvestments)
    .set({
      investmentName,
      amount: String(amount),
      investmentType,
      date: new Date(date),
      notes,
      updatedAt: new Date(),
    })
    .where(eq(personalInvestments.id, investmentId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/investments");
  return { success: true };
}

export async function deleteInvestment(
  userId: string,
  investmentId: string
): Promise<ActionResult> {
  const [existing] = await db
    .select({ id: personalInvestments.id })
    .from(personalInvestments)
    .where(
      and(
        eq(personalInvestments.id, investmentId),
        eq(personalInvestments.userId, userId)
      )
    )
    .limit(1);

  if (!existing)
    return { success: false, error: "Investment record not found" };

  await db
    .delete(personalInvestments)
    .where(eq(personalInvestments.id, investmentId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/investments");
  return { success: true };
}

// ─── Savings Goal Actions ──────────────────────────────────────────────────────

const savingsGoalSchema = z.object({
  goalName: z.string().min(1, "Goal name is required").max(255),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().min(0).optional(),
  targetDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;

function getRemainingMonths(today: Date, targetDate: Date): number {
  if (targetDate.getTime() <= today.getTime()) return 0;
  const y = targetDate.getFullYear() - today.getFullYear();
  const m = targetDate.getMonth() - today.getMonth();
  const d = targetDate.getDate() - today.getDate();
  return Math.max(0, y * 12 + m + (d > 0 ? 1 : 0));
}

async function getMonthlyIncome(userId: string): Promise<number> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonthRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), '0')` })
    .from(personalIncomes)
    .where(
      and(
        eq(personalIncomes.userId, userId),
        gte(personalIncomes.date, startOfMonth),
        lt(personalIncomes.date, startOfNextMonth)
      )
    );

  const thisMonth = Number(thisMonthRow?.total ?? 0);
  if (thisMonth > 0) return thisMonth;

  const [lastMonthRow] = await db
    .select({ total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), '0')` })
    .from(personalIncomes)
    .where(
      and(
        eq(personalIncomes.userId, userId),
        gte(personalIncomes.date, startOfLastMonth),
        lt(personalIncomes.date, startOfMonth)
      )
    );

  return Number(lastMonthRow?.total ?? 0);
}

export async function createSavingsGoal(
  userId: string,
  input: SavingsGoalInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = savingsGoalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { goalName, targetAmount, currentAmount, targetDate, notes } =
    parsed.data;

  // Affordability check: block if required monthly savings exceeds monthly income
  if (targetDate) {
    const today = new Date();
    const td = new Date(targetDate);
    const remainingMonths = getRemainingMonths(today, td);

    if (remainingMonths > 0) {
      const remaining = Math.max(0, targetAmount - (currentAmount ?? 0));
      const requiredMonthly = remaining / remainingMonths;
      const monthlyIncome = await getMonthlyIncome(userId);

      if (monthlyIncome > 0 && requiredMonthly > monthlyIncome) {
        return {
          success: false,
          error:
            "Required monthly savings exceeds your monthly income. Please reduce the target amount or extend the target date.",
        };
      }
    }
  }

  const [record] = await db
    .insert(savingsGoals)
    .values({
      userId,
      goalName,
      targetAmount: String(targetAmount),
      currentAmount: String(currentAmount ?? 0),
      targetDate: targetDate ? new Date(targetDate) : null,
      notes,
    })
    .returning({ id: savingsGoals.id });

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/savings");
  return { success: true, data: { id: record.id } };
}

export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  input: SavingsGoalInput
): Promise<ActionResult> {
  const parsed = savingsGoalSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [existing] = await db
    .select({ id: savingsGoals.id })
    .from(savingsGoals)
    .where(
      and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId))
    )
    .limit(1);

  if (!existing) return { success: false, error: "Savings goal not found" };

  const { goalName, targetAmount, currentAmount, targetDate, notes } =
    parsed.data;

  const target = Number(targetAmount);
  const current = Number(currentAmount ?? 0);

  await db
    .update(savingsGoals)
    .set({
      goalName,
      targetAmount: String(target),
      currentAmount: String(current),
      targetDate: targetDate ? new Date(targetDate) : null,
      notes,
      isCompleted: current >= target,
      updatedAt: new Date(),
    })
    .where(eq(savingsGoals.id, goalId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/savings");
  return { success: true };
}

const updateProgressSchema = z.object({
  currentAmount: z.number().min(0, "Amount must be non-negative"),
});

export async function updateGoalProgress(
  userId: string,
  goalId: string,
  currentAmount: number
): Promise<ActionResult> {
  const parsed = updateProgressSchema.safeParse({ currentAmount });
  if (!parsed.success) return { success: false, error: "Invalid amount" };

  const [existing] = await db
    .select({ id: savingsGoals.id, targetAmount: savingsGoals.targetAmount })
    .from(savingsGoals)
    .where(
      and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId))
    )
    .limit(1);

  if (!existing) return { success: false, error: "Savings goal not found" };

  const current = parsed.data.currentAmount;
  const target = Number(existing.targetAmount);

  await db
    .update(savingsGoals)
    .set({
      currentAmount: String(current),
      isCompleted: current >= target,
      updatedAt: new Date(),
    })
    .where(eq(savingsGoals.id, goalId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/savings");
  return { success: true };
}

export async function deleteSavingsGoal(
  userId: string,
  goalId: string
): Promise<ActionResult> {
  const [existing] = await db
    .select({ id: savingsGoals.id })
    .from(savingsGoals)
    .where(
      and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId))
    )
    .limit(1);

  if (!existing) return { success: false, error: "Savings goal not found" };

  await db.delete(savingsGoals).where(eq(savingsGoals.id, goalId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/savings");
  return { success: true };
}

// ─── Loan Actions ──────────────────────────────────────────────────────────────

const loanSchema = z.object({
  loanName: z.string().min(1, "Loan name is required").max(255),
  totalAmount: z.number().positive("Total amount must be positive"),
  outstandingAmount: z.number().min(0, "Outstanding amount must be non-negative"),
  emiAmount: z.number().positive("EMI amount must be positive"),
  loanType: z.enum([
    "home_loan",
    "car_loan",
    "personal_loan",
    "education_loan",
    "credit_card_emi",
    "other",
  ]),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export type LoanInput = z.infer<typeof loanSchema>;

export async function createLoan(
  userId: string,
  input: LoanInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = loanSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const {
    loanName,
    totalAmount,
    outstandingAmount,
    emiAmount,
    loanType,
    startDate,
    endDate,
    notes,
  } = parsed.data;

  const [record] = await db
    .insert(loans)
    .values({
      userId,
      loanName,
      totalAmount: String(totalAmount),
      outstandingAmount: String(outstandingAmount),
      emiAmount: String(emiAmount),
      loanType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes,
    })
    .returning({ id: loans.id });

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/loans");
  return { success: true, data: { id: record.id } };
}

export async function updateLoan(
  userId: string,
  loanId: string,
  input: LoanInput
): Promise<ActionResult> {
  const parsed = loanSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [existing] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
    .limit(1);

  if (!existing) return { success: false, error: "Loan not found" };

  const {
    loanName,
    totalAmount,
    outstandingAmount,
    emiAmount,
    loanType,
    startDate,
    endDate,
    notes,
  } = parsed.data;

  await db
    .update(loans)
    .set({
      loanName,
      totalAmount: String(totalAmount),
      outstandingAmount: String(outstandingAmount),
      emiAmount: String(emiAmount),
      loanType,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes,
      isActive: Number(outstandingAmount) > 0,
      updatedAt: new Date(),
    })
    .where(eq(loans.id, loanId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/loans");
  return { success: true };
}

export async function deleteLoan(
  userId: string,
  loanId: string
): Promise<ActionResult> {
  const [existing] = await db
    .select({ id: loans.id })
    .from(loans)
    .where(and(eq(loans.id, loanId), eq(loans.userId, userId)))
    .limit(1);

  if (!existing) return { success: false, error: "Loan not found" };

  await db.delete(loans).where(eq(loans.id, loanId));

  revalidatePath("/personal-finance");
  revalidatePath("/personal-finance/loans");
  return { success: true };
}
