"use server";

import { db } from "@/db";
import {
  settlements,
  payments,
  expenses,
  expenseParticipants,
  groupMembers,
  users,
  auditLogs,
} from "@/db/schema";
import { eq, and, asc, desc, inArray, count, lt } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notify";
import { insertSystemMessage } from "@/lib/system-message";
import type { ActionResult } from "./auth";

export interface RawDebt {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface OptimizedTransaction {
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toName: string;
  amount: number;
}

export interface MemberBalance {
  userId: string;
  name: string;
  netBalance: number;
}

export interface AwaitingConfirmationItem {
  id: string;
  amount: number;
  paymentMethod: string | null;
  paymentReference: string | null;
  note: string | null;
  submittedAt: Date | null;
  fromUserId: string;
  fromUserName: string;
}

export async function computeGroupBalances(groupId: string): Promise<{
  rawDebts: RawDebt[];
  memberBalances: MemberBalance[];
  optimizedTransactions: OptimizedTransaction[];
  nameMap: Map<string, string>;
}> {
  const allShares = await db
    .select({
      participantUserId: expenseParticipants.userId,
      shareAmount: expenseParticipants.shareAmount,
      expensePaidById: expenses.paidById,
    })
    .from(expenseParticipants)
    .innerJoin(expenses, eq(expenseParticipants.expenseId, expenses.id))
    .where(eq(expenses.groupId, groupId));

  const grossDebtMap = new Map<string, number>();
  for (const r of allShares) {
    if (r.participantUserId === r.expensePaidById) continue;
    const key = `${r.participantUserId}::${r.expensePaidById}`;
    grossDebtMap.set(key, (grossDebtMap.get(key) ?? 0) + Number(r.shareAmount));
  }

  // Only completed settlements reduce debt (awaiting_confirmation does NOT count)
  const completedSettlements = await db
    .select({
      fromUserId: settlements.fromUserId,
      toUserId: settlements.toUserId,
      amount: settlements.amount,
    })
    .from(settlements)
    .where(and(eq(settlements.groupId, groupId), eq(settlements.status, "completed")));

  const paidMap = new Map<string, number>();
  for (const s of completedSettlements) {
    const key = `${s.fromUserId}::${s.toUserId}`;
    paidMap.set(key, (paidMap.get(key) ?? 0) + Number(s.amount));
  }

  const netDebtMap = new Map<string, number>();
  for (const [key, gross] of grossDebtMap) {
    const [from, to] = key.split("::");
    const paid = paidMap.get(key) ?? 0;
    const net = gross - paid;
    if (net > 0.01) {
      netDebtMap.set(key, net);
    } else if (net < -0.01) {
      const reverseKey = `${to}::${from}`;
      netDebtMap.set(reverseKey, (netDebtMap.get(reverseKey) ?? 0) + Math.abs(net));
    }
  }

  for (const [key, paid] of paidMap) {
    if (!grossDebtMap.has(key)) {
      const [from, to] = key.split("::");
      const reverseKey = `${to}::${from}`;
      netDebtMap.set(reverseKey, (netDebtMap.get(reverseKey) ?? 0) + paid);
    }
  }

  const rawDebts: RawDebt[] = Array.from(netDebtMap.entries()).map(([key, amount]) => {
    const [fromUserId, toUserId] = key.split("::");
    return { fromUserId, toUserId, amount };
  });

  const involvedIds = [
    ...new Set([
      ...rawDebts.map((d) => d.fromUserId),
      ...rawDebts.map((d) => d.toUserId),
    ]),
  ];

  const memberRows =
    involvedIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, involvedIds))
      : [];

  const nameMap = new Map(memberRows.map((u) => [u.id, u.name ?? "Unknown"]));

  const netMap = new Map<string, number>();
  for (const { fromUserId, toUserId, amount } of rawDebts) {
    netMap.set(fromUserId, (netMap.get(fromUserId) ?? 0) - amount);
    netMap.set(toUserId, (netMap.get(toUserId) ?? 0) + amount);
  }

  // Round all net balances to 2 decimal places so memberBalances display
  // and optimizeSettlements use exactly the same values (avoids off-by-one
  // where raw=-0.01 rounds to -0.01 in display but fails the strict < -0.01 check).
  for (const [key, value] of netMap) {
    netMap.set(key, Math.round(value * 100) / 100);
  }

  const memberBalances: MemberBalance[] = Array.from(netMap.entries()).map(
    ([userId, netBalance]) => ({
      userId,
      name: nameMap.get(userId) ?? "Unknown",
      netBalance,
    })
  );

  const optimizedTransactions = optimizeSettlements(netMap, nameMap);

  return { rawDebts, memberBalances, optimizedTransactions, nameMap };
}

export const computeFlatBalances = computeGroupBalances;

function optimizeSettlements(
  netMap: Map<string, number>,
  nameMap: Map<string, string>
): OptimizedTransaction[] {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [id, balance] of netMap) {
    if (balance >= 0.01) creditors.push({ id, amount: balance });
    else if (balance <= -0.01) debtors.push({ id, amount: -balance });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: OptimizedTransaction[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount);
    const rounded = Math.round(amount * 100) / 100;

    if (rounded > 0.01) {
      transactions.push({
        fromUserId: debtors[di].id,
        fromName: nameMap.get(debtors[di].id) ?? "Unknown",
        toUserId: creditors[ci].id,
        toName: nameMap.get(creditors[ci].id) ?? "Unknown",
        amount: rounded,
      });
    }

    creditors[ci].amount -= amount;
    debtors[di].amount -= amount;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return transactions;
}

const recordSettlementSchema = z.object({
  groupId: z.string().uuid(),
  toUserId: z.string().uuid(),
  amount: z.number().positive("Amount must be positive"),
  method: z.string().max(50).optional(),
  reference: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
});

export async function recordSettlement(
  userId: string,
  input: z.infer<typeof recordSettlementSchema>
): Promise<ActionResult<{ settlementId: string }>> {
  const parsed = recordSettlementSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { groupId, toUserId, amount, method, reference, note } = parsed.data;

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

  // Prevent duplicate submissions while one is already awaiting confirmation
  const [existing] = await db
    .select({ id: settlements.id })
    .from(settlements)
    .where(
      and(
        eq(settlements.groupId, groupId),
        eq(settlements.fromUserId, userId),
        eq(settlements.toUserId, toUserId),
        eq(settlements.status, "awaiting_confirmation")
      )
    )
    .limit(1);

  if (existing) {
    return {
      success: false,
      error: "A payment is already awaiting confirmation. Please wait for the recipient to respond.",
    };
  }

  const [settlement] = await db
    .insert(settlements)
    .values({
      groupId,
      fromUserId: userId,
      toUserId,
      amount: String(amount),
      status: "awaiting_confirmation",
      note,
      paymentMethod: method ?? null,
      paymentReference: reference ?? null,
      submittedAt: new Date(),
    })
    .returning({ id: settlements.id });

  await db.insert(payments).values({
    settlementId: settlement.id,
    groupId,
    fromUserId: userId,
    toUserId,
    amount: String(amount),
    method: method ?? null,
    reference: reference ?? null,
    note: note ?? null,
  });

  await db.insert(auditLogs).values({
    groupId,
    userId,
    action: "settlement.payment_submitted",
    resource: "settlement",
    resourceId: settlement.id,
    after: { amount, toUserId, status: "awaiting_confirmation" },
  });

  const [fromUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await notifyUsers(
    [toUserId],
    groupId,
    "payment_confirmation_required",
    "Payment Confirmation Required",
    `${fromUser?.name ?? "Someone"} has recorded a payment of ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}. Please confirm whether you received it.`,
    { data: { settlementId: settlement.id }, url: "/settlements" }
  );

  revalidatePath("/settlements");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { success: true, data: { settlementId: settlement.id } };
}

export async function confirmPayment(
  userId: string,
  settlementId: string
): Promise<ActionResult<void>> {
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(eq(settlements.id, settlementId))
    .limit(1);

  if (!settlement) return { success: false, error: "Settlement not found" };
  if (settlement.toUserId !== userId)
    return { success: false, error: "Only the payment receiver can confirm" };
  if (settlement.status !== "awaiting_confirmation")
    return { success: false, error: "This payment is not awaiting confirmation" };

  await db
    .update(settlements)
    .set({ status: "completed", settledAt: new Date(), updatedAt: new Date() })
    .where(eq(settlements.id, settlementId));

  await markExpenseSharesPaid(
    settlement.fromUserId,
    settlement.toUserId,
    settlement.groupId,
    Number(settlement.amount)
  );

  const settlementUsers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, [userId, settlement.fromUserId]));

  const userNameMap = new Map(settlementUsers.map((u) => [u.id, u.name]));
  const confirmingUserName = userNameMap.get(userId) ?? "The recipient";
  const payerName = userNameMap.get(settlement.fromUserId) ?? "Someone";

  await notifyUsers(
    [settlement.fromUserId],
    settlement.groupId,
    "payment_confirmed",
    "Payment Confirmed",
    `${confirmingUserName} has confirmed receipt of your payment of ₹${Number(settlement.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.`,
    { data: { settlementId }, url: "/settlements" }
  );

  await insertSystemMessage(
    settlement.groupId,
    "settlement_update",
    `${payerName} settled ₹${Number(settlement.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} with ${confirmingUserName}`
  );

  await db.insert(auditLogs).values({
    groupId: settlement.groupId,
    userId,
    action: "settlement.payment_confirmed",
    resource: "settlement",
    resourceId: settlementId,
    after: { status: "completed", confirmedBy: userId },
  });

  revalidatePath("/settlements");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function rejectPayment(
  userId: string,
  settlementId: string,
  reason?: string
): Promise<ActionResult<void>> {
  const [settlement] = await db
    .select()
    .from(settlements)
    .where(eq(settlements.id, settlementId))
    .limit(1);

  if (!settlement) return { success: false, error: "Settlement not found" };
  if (settlement.toUserId !== userId)
    return { success: false, error: "Only the payment receiver can reject" };
  if (settlement.status !== "awaiting_confirmation")
    return { success: false, error: "This payment is not awaiting confirmation" };

  await db
    .update(settlements)
    .set({
      status: "rejected",
      rejectedBy: userId,
      rejectedAt: new Date(),
      rejectionReason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(settlements.id, settlementId));

  const [rejectingUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const reasonText = reason ? ` Reason: ${reason}` : " Please review and resubmit if necessary.";

  await notifyUsers(
    [settlement.fromUserId],
    settlement.groupId,
    "payment_rejected",
    "Payment Rejected",
    `${rejectingUser?.name ?? "The recipient"} has rejected your payment of ₹${Number(settlement.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}.${reasonText}`,
    { data: { settlementId }, url: "/settlements" }
  );

  await db.insert(auditLogs).values({
    groupId: settlement.groupId,
    userId,
    action: "settlement.payment_rejected",
    resource: "settlement",
    resourceId: settlementId,
    after: { status: "rejected", rejectedBy: userId, rejectionReason: reason ?? null },
  });

  revalidatePath("/settlements");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function getAwaitingConfirmations(
  groupId: string,
  userId: string
): Promise<AwaitingConfirmationItem[]> {
  const rows = await db
    .select({
      id: settlements.id,
      amount: settlements.amount,
      paymentMethod: settlements.paymentMethod,
      paymentReference: settlements.paymentReference,
      note: settlements.note,
      submittedAt: settlements.submittedAt,
      fromUserId: settlements.fromUserId,
      fromUserName: users.name,
    })
    .from(settlements)
    .innerJoin(users, eq(users.id, settlements.fromUserId))
    .where(
      and(
        eq(settlements.groupId, groupId),
        eq(settlements.toUserId, userId),
        eq(settlements.status, "awaiting_confirmation")
      )
    )
    .orderBy(asc(settlements.submittedAt));

  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    paymentMethod: r.paymentMethod,
    paymentReference: r.paymentReference,
    note: r.note,
    submittedAt: r.submittedAt,
    fromUserId: r.fromUserId,
    fromUserName: r.fromUserName ?? "Unknown",
  }));
}

export async function getAwaitingConfirmationCount(
  groupId: string,
  userId: string
): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(settlements)
    .where(
      and(
        eq(settlements.groupId, groupId),
        eq(settlements.toUserId, userId),
        eq(settlements.status, "awaiting_confirmation")
      )
    );
  return total;
}

export async function getSettlementsAwaitingReminderSend(): Promise<
  Array<{
    id: string;
    toUserId: string;
    groupId: string;
    amount: string;
    fromUserName: string;
  }>
> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return db
    .select({
      id: settlements.id,
      toUserId: settlements.toUserId,
      groupId: settlements.groupId,
      amount: settlements.amount,
      fromUserName: users.name,
    })
    .from(settlements)
    .innerJoin(users, eq(users.id, settlements.fromUserId))
    .where(
      and(
        eq(settlements.status, "awaiting_confirmation"),
        lt(settlements.submittedAt, cutoff)
      )
    );
}

export async function checkExistingSettlement(
  fromUserId: string,
  toUserId: string,
  groupId: string
): Promise<{ status: "awaiting_confirmation" | "completed" | "rejected" | null }> {
  // 1. Pending duplicate check — always block a second in-flight submission.
  const [awaiting] = await db
    .select({ id: settlements.id })
    .from(settlements)
    .where(
      and(
        eq(settlements.groupId, groupId),
        eq(settlements.fromUserId, fromUserId),
        eq(settlements.toUserId, toUserId),
        eq(settlements.status, "awaiting_confirmation")
      )
    )
    .limit(1);

  if (awaiting) return { status: "awaiting_confirmation" };

  // 2. Most recent terminal settlement for this pair.
  const [latest] = await db
    .select({ status: settlements.status })
    .from(settlements)
    .where(
      and(
        eq(settlements.groupId, groupId),
        eq(settlements.fromUserId, fromUserId),
        eq(settlements.toUserId, toUserId),
        inArray(settlements.status, ["completed", "rejected"])
      )
    )
    .orderBy(desc(settlements.createdAt))
    .limit(1);

  if (!latest) return { status: null };

  // Rejected payments can always be resubmitted.
  if (latest.status === "rejected") return { status: "rejected" };

  // 3. For completed: only block when there is no remaining unpaid debt.
  //    If a new expense was added after the last settlement, unpaid shares
  //    will exist and the old "completed" record must not prevent a new payment.
  const [unpaidShare] = await db
    .select({ id: expenseParticipants.id })
    .from(expenseParticipants)
    .innerJoin(expenses, eq(expenseParticipants.expenseId, expenses.id))
    .where(
      and(
        eq(expenseParticipants.userId, fromUserId),
        eq(expenseParticipants.isPaid, false),
        eq(expenses.paidById, toUserId),
        eq(expenses.groupId, groupId)
      )
    )
    .limit(1);

  // Unpaid shares mean there is fresh debt → let the dialog open.
  return { status: unpaidShare ? null : "completed" };
}

async function markExpenseSharesPaid(
  fromUserId: string,
  toUserId: string,
  groupId: string,
  amount: number
): Promise<void> {
  const unpaidShares = await db
    .select({
      id: expenseParticipants.id,
      expenseId: expenseParticipants.expenseId,
      shareAmount: expenseParticipants.shareAmount,
    })
    .from(expenseParticipants)
    .innerJoin(expenses, eq(expenseParticipants.expenseId, expenses.id))
    .where(
      and(
        eq(expenseParticipants.userId, fromUserId),
        eq(expenseParticipants.isPaid, false),
        eq(expenses.paidById, toUserId),
        eq(expenses.groupId, groupId)
      )
    )
    .orderBy(asc(expenses.date));

  let remaining = amount;
  const toMarkPaid: string[] = [];
  const affectedExpenseIds = new Set<string>();

  for (const share of unpaidShares) {
    if (remaining <= 0.01) break;
    const shareAmt = Number(share.shareAmount);
    if (shareAmt <= remaining + 0.01) {
      toMarkPaid.push(share.id);
      affectedExpenseIds.add(share.expenseId);
      remaining -= shareAmt;
    }
  }

  if (toMarkPaid.length === 0) return;

  await db
    .update(expenseParticipants)
    .set({ isPaid: true })
    .where(inArray(expenseParticipants.id, toMarkPaid));

  for (const expenseId of affectedExpenseIds) {
    const [unpaid] = await db
      .select({ count: count() })
      .from(expenseParticipants)
      .where(
        and(
          eq(expenseParticipants.expenseId, expenseId),
          eq(expenseParticipants.isPaid, false)
        )
      );

    if (!unpaid || unpaid.count === 0) {
      await db
        .update(expenses)
        .set({ isSettled: true })
        .where(eq(expenses.id, expenseId));
    }
  }
}
