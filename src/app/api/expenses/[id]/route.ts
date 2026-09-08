import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { expenses, expenseParticipants, groupMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [expense] = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      category: expenses.category,
      splitType: expenses.splitType,
      date: expenses.date,
      isSettled: expenses.isSettled,
      description: expenses.description,
      groupId: expenses.groupId,
      paidById: expenses.paidById,
      paidByName: users.name,
      receiptUrls: expenses.receiptUrls,
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.paidById, users.id))
    .where(eq(expenses.id, id))
    .limit(1);

  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, expense.groupId),
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const participants = await db
    .select({
      userId: expenseParticipants.userId,
      name: users.name,
      shareAmount: expenseParticipants.shareAmount,
      sharePercentage: expenseParticipants.sharePercentage,
      isPaid: expenseParticipants.isPaid,
    })
    .from(expenseParticipants)
    .innerJoin(users, eq(expenseParticipants.userId, users.id))
    .where(eq(expenseParticipants.expenseId, id));

  return NextResponse.json({ ...expense, participants });
}
