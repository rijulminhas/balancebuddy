import { db } from "@/db";
import { expenses, users } from "@/db/schema";
import { eq, count, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  CalendarDays,
  Receipt,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { fmt } from "./utils";

interface Props {
  groupId: string;
}

export async function ExpenseAnalytics({ groupId }: Props) {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [[groupStats], memberStats] = await Promise.all([
    db
      .select({
        totalAllTime: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
        totalCurrentMonth: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.date} >= ${currentMonthStart.toISOString()}::timestamptz THEN ${expenses.amount} ELSE 0 END), 0)`,
        totalPreviousMonth: sql<string>`COALESCE(SUM(CASE WHEN ${expenses.date} >= ${prevMonthStart.toISOString()}::timestamptz AND ${expenses.date} < ${currentMonthStart.toISOString()}::timestamptz THEN ${expenses.amount} ELSE 0 END), 0)`,
        totalCount: count(),
      })
      .from(expenses)
      .where(eq(expenses.groupId, groupId)),

    db
      .select({
        userId: expenses.paidById,
        userName: users.name,
        totalPaid: sql<string>`COALESCE(SUM(${expenses.amount}), 0)`,
        expenseCount: count(),
      })
      .from(expenses)
      .innerJoin(users, eq(expenses.paidById, users.id))
      .where(eq(expenses.groupId, groupId))
      .groupBy(expenses.paidById, users.name)
      .orderBy(sql`SUM(${expenses.amount}) DESC NULLS LAST`),
  ]);

  const allTime = Number(groupStats.totalAllTime);
  const currentMonth = Number(groupStats.totalCurrentMonth);
  const prevMonth = Number(groupStats.totalPreviousMonth);
  const totalCount = groupStats.totalCount;

  const diff = currentMonth - prevMonth;
  const diffPct = prevMonth > 0.005 ? (diff / prevMonth) * 100 : null;
  const isIncrease = diff > 0.005;
  const isDecrease = diff < -0.005;

  const members = memberStats.map((m) => ({
    userId: m.userId,
    userName: m.userName,
    totalPaid: Number(m.totalPaid),
    expenseCount: m.expenseCount,
    contributionPct: allTime > 0 ? (Number(m.totalPaid) / allTime) * 100 : 0,
  }));

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Group Analytics
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total (All Time)</p>
                <p className="text-xl font-bold mt-0.5">₹{fmt(allTime)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-xl font-bold mt-0.5">₹{fmt(currentMonth)}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">vs Last Month</p>
                <p
                  className={`text-xl font-bold mt-0.5 ${
                    isIncrease
                      ? "text-destructive"
                      : isDecrease
                      ? "text-green-600"
                      : ""
                  }`}
                >
                  {Math.abs(diff) < 0.005
                    ? "—"
                    : `${isIncrease ? "+" : "-"}₹${fmt(Math.abs(diff))}`}
                </p>
                {diffPct !== null ? (
                  <p
                    className={`text-xs mt-0.5 ${
                      isIncrease
                        ? "text-destructive"
                        : isDecrease
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isIncrease ? "+" : ""}
                    {diffPct.toFixed(1)}% from last month
                  </p>
                ) : prevMonth < 0.005 && currentMonth > 0 ? (
                  <p className="text-xs mt-0.5 text-muted-foreground">
                    No last month data
                  </p>
                ) : null}
              </div>
              {isIncrease ? (
                <TrendingUp className="h-8 w-8 text-destructive/30" />
              ) : isDecrease ? (
                <TrendingDown className="h-8 w-8 text-green-600/30" />
              ) : (
                <Minus className="h-8 w-8 text-muted-foreground/30" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold mt-0.5">{totalCount}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {members.length > 0 && (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Member Contribution Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Contribution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.userId}>
                      <TableCell className="font-medium text-sm">
                        {member.userName}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₹{fmt(member.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {member.expenseCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{
                                width: `${Math.min(100, member.contributionPct)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {member.contributionPct.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
