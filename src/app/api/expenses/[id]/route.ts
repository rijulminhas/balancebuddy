import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { expenses, expenseParticipants, flatMembers, users } from "@/db/schema";
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
      flatId: expenses.flatId,
      paidById: expenses.paidById,
      paidByName: users.name,
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.paidById, users.id))
    .where(eq(expenses.id, id))
    .limit(1);

  if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify session user is a member of this flat
  const [membership] = await db
    .select({ id: flatMembers.id })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.flatId, expense.flatId),
        eq(flatMembers.userId, session.user.id),
        eq(flatMembers.status, "active")
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
