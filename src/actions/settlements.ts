"use server";

import { db } from "@/db";
import {
  settlements,
  payments,
  expenses,
  expenseParticipants,
  groupMembers,
  users,
} from "@/db/schema";
import { eq, and, asc, inArray, count } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notify";
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

export async function computeGroupBalances(groupId: string): Promise<{
  rawDebts: RawDebt[];
  memberBalances: MemberBalance[];
  optimizedTransactions: OptimizedTransaction[];
  nameMap: Map<string, string>;
}> {
  const unpaidShares = await db
    .select({
      participantUserId: expenseParticipants.userId,
      shareAmount: expenseParticipants.shareAmount,
      expensePaidById: expenses.paidById,
    })
    .from(expenseParticipants)
    .innerJoin(expenses, eq(expenseParticipants.expenseId, expenses.id))
    .where(
      and(eq(expenses.groupId, groupId), eq(expenseParticipants.isPaid, false))
    );

  const rawDebts: RawDebt[] = unpaidShares
    .filter((r) => r.participantUserId !== r.expensePaidById)
    .map((r) => ({
      fromUserId: r.participantUserId,
      toUserId: r.expensePaidById,
      amount: Number(r.shareAmount),
    }));

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

  const memberBalances: MemberBalance[] = Array.from(netMap.entries()).map(
    ([userId, netBalance]) => ({
      userId,
      name: nameMap.get(userId) ?? "Unknown",
      netBalance: Math.round(netBalance * 100) / 100,
    })
  );

  const optimizedTransactions = optimizeSettlements(netMap, nameMap);

  return { rawDebts, memberBalances, optimizedTransactions, nameMap };
}

// Backward-compat alias
export const computeFlatBalances = computeGroupBalances;

function optimizeSettlements(
  netMap: Map<string, number>,
  nameMap: Map<string, string>
): OptimizedTransaction[] {
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  for (const [id, balance] of netMap) {
    if (balance > 0.01) creditors.push({ id, amount: balance });
    else if (balance < -0.01) debtors.push({ id, amount: -balance });
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

  const [settlement] = await db
    .insert(settlements)
    .values({
      groupId,
      fromUserId: userId,
      toUserId,
      amount: String(amount),
      status: "completed",
      settledAt: new Date(),
      note,
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
        eq(expenseParticipants.userId, userId),
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

  if (toMarkPaid.length > 0) {
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

  const [fromUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await notifyUsers(
    [toUserId],
    groupId,
    "settlement_completed",
    "Payment received",
    `${fromUser?.name ?? "Someone"} paid you ₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    { data: { settlementId: settlement.id }, url: "/settlements" }
  );

  revalidatePath("/settlements");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");

  return { success: true, data: { settlementId: settlement.id } };
}
