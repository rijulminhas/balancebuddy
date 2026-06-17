"use server";

import { db } from "@/db";
import {
  expenses,
  expenseParticipants,
  groupMembers,
  settlements,
  auditLogs,
  users,
} from "@/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notify";
import type { ActionResult } from "./auth";

const expenseSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  amount: z.number().positive("Amount must be positive"),
  category: z.enum([
    "groceries",
    "rent",
    "utilities",
    "internet",
    "repairs",
    "maintenance",
    "entertainment",
    "miscellaneous",
  ]),
  splitType: z.enum(["equal", "percentage", "amount", "custom"]),
  date: z.string().datetime().optional(),
  participantIds: z.array(z.string().uuid()).min(1),
  customSplits: z.record(z.string(), z.number()).optional(),
  receiptUrls: z.array(z.string()).optional(),
});

type ExpenseInput = z.infer<typeof expenseSchema>;

export async function createExpense(
  userId: string,
  input: ExpenseInput
): Promise<ActionResult<{ expenseId: string }>> {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const {
    groupId,
    title,
    description,
    amount,
    category,
    splitType,
    date,
    participantIds,
    customSplits,
    receiptUrls,
  } = parsed.data;

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "Not a member of this group" };

  const shares = calculateShares(amount, splitType, participantIds, customSplits);

  const [expense] = await db
    .insert(expenses)
    .values({
      groupId,
      paidById: userId,
      title,
      description,
      amount: String(amount),
      category,
      splitType,
      date: date ? new Date(date) : new Date(),
      receiptUrls: receiptUrls ?? [],
    })
    .returning({ id: expenses.id });

  await db.insert(expenseParticipants).values(
    shares.map(({ participantId, shareAmount, sharePercentage }) => ({
      expenseId: expense.id,
      userId: participantId,
      shareAmount: String(shareAmount),
      sharePercentage: sharePercentage ? String(sharePercentage) : null,
      isPaid: participantId === userId,
    }))
  );

  await db.insert(auditLogs).values({
    groupId,
    userId,
    action: "expense.created",
    resource: "expense",
    resourceId: expense.id,
    after: { title, amount, splitType },
  });

  const [payer] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const otherParticipantIds = participantIds.filter((id) => id !== userId);
  if (otherParticipantIds.length > 0) {
    await notifyUsers(
      otherParticipantIds,
      groupId,
      "expense_added",
      "New expense added",
      `${payer?.name ?? "Someone"} added "${title}" — ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      { data: { expenseId: expense.id }, url: `/expenses/${expense.id}` }
    );
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { success: true, data: { expenseId: expense.id } };
}

function calculateShares(
  amount: number,
  splitType: string,
  participantIds: string[],
  customSplits?: Record<string, number>
): Array<{
  participantId: string;
  shareAmount: number;
  sharePercentage?: number;
}> {
  if (splitType === "equal") {
    const share = Math.round((amount / participantIds.length) * 100) / 100;
    return participantIds.map((id) => ({ participantId: id, shareAmount: share }));
  }

  if (splitType === "percentage" && customSplits) {
    return participantIds.map((id) => {
      const pct = customSplits[id] ?? 0;
      return {
        participantId: id,
        shareAmount: Math.round(((amount * pct) / 100) * 100) / 100,
        sharePercentage: pct,
      };
    });
  }

  if ((splitType === "amount" || splitType === "custom") && customSplits) {
    return participantIds.map((id) => ({
      participantId: id,
      shareAmount: customSplits[id] ?? 0,
    }));
  }

  const share = Math.round((amount / participantIds.length) * 100) / 100;
  return participantIds.map((id) => ({ participantId: id, shareAmount: share }));
}

export async function settleShare(
  userId: string,
  expenseId: string
): Promise<ActionResult> {
  const [participant] = await db
    .select({
      id: expenseParticipants.id,
      expenseId: expenseParticipants.expenseId,
    })
    .from(expenseParticipants)
    .where(
      and(
        eq(expenseParticipants.expenseId, expenseId),
        eq(expenseParticipants.userId, userId)
      )
    )
    .limit(1);

  if (!participant) return { success: false, error: "Participant record not found" };

  await db
    .update(expenseParticipants)
    .set({ isPaid: true })
    .where(eq(expenseParticipants.id, participant.id));

  const unpaid = await db
    .select({ id: expenseParticipants.id })
    .from(expenseParticipants)
    .where(
      and(
        eq(expenseParticipants.expenseId, expenseId),
        eq(expenseParticipants.isPaid, false)
      )
    );

  if (unpaid.length === 0) {
    await db
      .update(expenses)
      .set({ isSettled: true })
      .where(eq(expenses.id, expenseId));
  }

  const [expense] = await db
    .select({
      paidById: expenses.paidById,
      title: expenses.title,
      groupId: expenses.groupId,
    })
    .from(expenses)
    .where(eq(expenses.id, expenseId))
    .limit(1);

  if (expense && expense.paidById !== userId) {
    const [settler] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await notifyUsers(
      [expense.paidById],
      expense.groupId,
      "settlement_completed",
      "Share marked as paid",
      `${settler?.name ?? "Someone"} paid their share for "${expense.title}"`,
      { data: { expenseId }, url: `/expenses/${expenseId}` }
    );
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteExpense(
  userId: string,
  expenseId: string
): Promise<ActionResult> {
  const [expense] = await db
    .select({
      id: expenses.id,
      groupId: expenses.groupId,
      paidById: expenses.paidById,
    })
    .from(expenses)
    .where(eq(expenses.id, expenseId))
    .limit(1);

  if (!expense) return { success: false, error: "Expense not found" };
  if (expense.paidById !== userId) {
    return { success: false, error: "Only the expense creator can delete it" };
  }

  await db.delete(expenses).where(eq(expenses.id, expenseId));

  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { success: true };
}

const DEFAULT_RESET_REASON = "Expenses are reset to 0 by all members decision";

export async function resetGroupExpenses(
  userId: string,
  groupId: string,
  reason?: string
): Promise<ActionResult> {
  // Verify requester is owner or admin
  const [membership] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "Not a member of this group" };
  if (membership.role !== "owner" && membership.role !== "admin") {
    return { success: false, error: "Only owners and admins can reset group expenses" };
  }

  const now = new Date();
  const resetReason = reason?.trim() || DEFAULT_RESET_REASON;

  // 1. Fetch all expense IDs for this group
  const groupExpenses = await db
    .select({ id: expenses.id })
    .from(expenses)
    .where(eq(expenses.groupId, groupId));

  if (groupExpenses.length > 0) {
    const expenseIds = groupExpenses.map((e) => e.id);

    // 2. Mark all expense participants as paid
    await db
      .update(expenseParticipants)
      .set({ isPaid: true, updatedAt: now })
      .where(
        and(
          inArray(expenseParticipants.expenseId, expenseIds),
          eq(expenseParticipants.isPaid, false)
        )
      );

    // 3. Mark all expenses as settled
    await db
      .update(expenses)
      .set({ isSettled: true, updatedAt: now })
      .where(and(eq(expenses.groupId, groupId), eq(expenses.isSettled, false)));
  }

  // 4. Cancel all open settlements for this group
  await db
    .update(settlements)
    .set({ status: "cancelled", updatedAt: now })
    .where(
      and(
        eq(settlements.groupId, groupId),
        or(
          eq(settlements.status, "pending"),
          eq(settlements.status, "awaiting_confirmation")
        )
      )
    );

  // 5. Audit log
  await db.insert(auditLogs).values({
    groupId,
    userId,
    action: "expense.reset",
    resource: "group",
    resourceId: groupId,
    after: { reason: resetReason },
  });

  // 6. Notify all active group members (except the requester)
  const activeMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));

  const [requester] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const memberIds = activeMembers.map((m) => m.userId);
  if (memberIds.length > 0) {
    await notifyUsers(
      memberIds,
      groupId,
      "general",
      "Group expenses reset to zero",
      resetReason,
      { data: { resetBy: requester?.name ?? "An admin", reason: resetReason }, url: "/expenses" }
    );
  }

  revalidatePath("/expenses");
  revalidatePath("/settlements");
  revalidatePath("/dashboard");

  return { success: true };
}
