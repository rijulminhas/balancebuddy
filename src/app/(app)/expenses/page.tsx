import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { expenses, expenseParticipants, flatMembers, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Receipt, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Expenses" };

const categoryColors: Record<string, "default" | "secondary" | "outline" | "success" | "warning" | "info"> = {
  groceries: "success",
  rent: "default",
  utilities: "info",
  internet: "secondary",
  repairs: "warning",
  maintenance: "warning",
  entertainment: "info",
  miscellaneous: "outline",
};

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ flatId: flatMembers.flatId })
    .from(flatMembers)
    .where(and(eq(flatMembers.userId, session.user.id), eq(flatMembers.status, "active")))
    .limit(1);

  if (!membership) redirect("/flats");

  const expenseList = await db
    .select({
      id: expenses.id,
      title: expenses.title,
      amount: expenses.amount,
      category: expenses.category,
      splitType: expenses.splitType,
      date: expenses.date,
      isSettled: expenses.isSettled,
      paidById: expenses.paidById,
      paidByName: users.name,
    })
    .from(expenses)
    .innerJoin(users, eq(expenses.paidById, users.id))
    .where(eq(expenses.flatId, membership.flatId))
    .orderBy(desc(expenses.date))
    .limit(50);

  // Fetch my participant rows for all expenses to compute summary
  const myParticipations = await db
    .select({
      expenseId: expenseParticipants.expenseId,
      shareAmount: expenseParticipants.shareAmount,
      isPaid: expenseParticipants.isPaid,
    })
    .from(expenseParticipants)
    .where(eq(expenseParticipants.userId, session.user.id));

  const myShareMap = new Map(
    myParticipations.map((p) => [p.expenseId, { shareAmount: Number(p.shareAmount), isPaid: p.isPaid }])
  );

  // Summary calculations
  let totalSpent = 0;   // total of expenses I paid
  let iOwe = 0;         // sum of my unpaid shares where I didn't pay
  let owedToMe = 0;     // sum of others' unpaid shares on expenses I paid

  // For owedToMe we need all participants on expenses I paid
  const myPaidExpenseIds = expenseList
    .filter((e) => e.paidById === session.user.id)
    .map((e) => e.id);

  let othersOwingRows: { expenseId: string; shareAmount: string; isPaid: boolean; userId: string }[] = [];
  if (myPaidExpenseIds.length > 0) {
    // Fetch all participants for expenses I paid
    const rows = await db
      .select({
        expenseId: expenseParticipants.expenseId,
        userId: expenseParticipants.userId,
        shareAmount: expenseParticipants.shareAmount,
        isPaid: expenseParticipants.isPaid,
      })
      .from(expenseParticipants)
      .where(eq(expenseParticipants.isPaid, false));

    othersOwingRows = rows.filter(
      (r) => myPaidExpenseIds.includes(r.expenseId) && r.userId !== session.user.id
    );
  }

  for (const e of expenseList) {
    if (e.paidById === session.user.id) {
      totalSpent += Number(e.amount);
    }
    const myShare = myShareMap.get(e.id);
    if (myShare && !myShare.isPaid && e.paidById !== session.user.id) {
      iOwe += myShare.shareAmount;
    }
  }
  owedToMe = othersOwingRows.reduce((s, r) => s + Number(r.shareAmount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {expenseList.length} expense{expenseList.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            Add expense
          </Link>
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total I paid</p>
                <p className="text-xl font-bold mt-0.5">₹{fmt(totalSpent)}</p>
              </div>
              <Wallet className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">You owe</p>
                <p className="text-xl font-bold mt-0.5 text-destructive">₹{fmt(iOwe)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Owed to you</p>
                <p className="text-xl font-bold mt-0.5 text-green-600">₹{fmt(owedToMe)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {expenseList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Receipt className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">No expenses yet</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Add your first shared expense to get started.
            </p>
            <Button asChild size="sm">
              <Link href="/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add expense
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">All expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Paid by</TableHead>
                    <TableHead>Split</TableHead>
                    <TableHead>Your share</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseList.map((expense) => {
                    const myShare = myShareMap.get(expense.id);
                    const iAmPayer = expense.paidById === session.user.id;
                    return (
                      <TableRow
                        key={expense.id}
                        className="cursor-pointer hover:bg-muted/50"
                      >
                        <TableCell className="font-medium text-sm">
                          <Link href={`/expenses/${expense.id}`} className="hover:underline">
                            {expense.title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={categoryColors[expense.category] ?? "outline"}>
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {iAmPayer ? "You" : expense.paidByName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground capitalize">
                          {expense.splitType}
                        </TableCell>
                        <TableCell className="text-sm">
                          {myShare ? (
                            <span className={myShare.isPaid || iAmPayer ? "text-muted-foreground" : "text-destructive font-medium"}>
                              ₹{fmt(myShare.shareAmount)}
                              {myShare.isPaid || iAmPayer
                                ? <span className="ml-1 text-xs">✓</span>
                                : <span className="ml-1 text-xs">(owed)</span>
                              }
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(expense.date), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{fmt(Number(expense.amount))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={expense.isSettled ? "success" : "warning"}>
                            {expense.isSettled ? "Settled" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
