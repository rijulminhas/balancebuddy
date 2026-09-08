import { db } from "@/db";
import { personalExpenses } from "@/db/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Plus, ReceiptText } from "lucide-react";
import { fmt, formatDate, toDateInputValue } from "@/components/personal-finance/utils";
import {
  PERSONAL_EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_COLORS,
  PAGE_SIZE,
} from "@/components/personal-finance/constants";
import { PersonalExpenseFormDialog } from "./personal-expense-form-dialog";
import { PersonalExpenseDeleteButton } from "./personal-expense-delete-button";

// ─── Props ────────────────────────────────────────────────────────────────────

interface PersonalExpensesListProps {
  page: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export async function PersonalExpensesList({ page }: PersonalExpensesListProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const offset = (page - 1) * PAGE_SIZE;

  // Current month boundaries
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // ── Parallel queries ──────────────────────────────────────────────────────
  const [monthlyTotalResult, categoryBreakdown, totalCountResult, records] =
    await Promise.all([
      // 1. Monthly total (current month)
      db
        .select({ total: sql<string>`COALESCE(SUM(${personalExpenses.amount}), 0)` })
        .from(personalExpenses)
        .where(
          and(
            eq(personalExpenses.userId, userId),
            gte(personalExpenses.date, monthStart),
            lte(personalExpenses.date, monthEnd)
          )
        ),

      // 2. Top 5 categories by total amount (all time)
      db
        .select({
          category: personalExpenses.category,
          total: sql<string>`SUM(${personalExpenses.amount})`,
        })
        .from(personalExpenses)
        .where(eq(personalExpenses.userId, userId))
        .groupBy(personalExpenses.category)
        .orderBy(desc(sql`SUM(${personalExpenses.amount})`))
        .limit(5),

      // 3. Total record count
      db
        .select({ value: count() })
        .from(personalExpenses)
        .where(eq(personalExpenses.userId, userId)),

      // 4. Paginated list
      db
        .select({
          id: personalExpenses.id,
          title: personalExpenses.title,
          amount: personalExpenses.amount,
          category: personalExpenses.category,
          date: personalExpenses.date,
          notes: personalExpenses.notes,
        })
        .from(personalExpenses)
        .where(eq(personalExpenses.userId, userId))
        .orderBy(desc(personalExpenses.date))
        .limit(PAGE_SIZE)
        .offset(offset),
    ]);

  const monthlyTotal = Number(monthlyTotalResult[0]?.total ?? 0);
  const totalRecords = totalCountResult[0]?.value ?? 0;
  const totalPages = Math.ceil(totalRecords / PAGE_SIZE);

  // Unique category count across all records for summary
  const uniqueCategoryCount = categoryBreakdown.length;

  // Max amount for progress bar scaling
  const maxCategoryAmount = categoryBreakdown.reduce(
    (max, row) => Math.max(max, Number(row.total)),
    0
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getCategoryLabel(value: string) {
    return (
      PERSONAL_EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ??
      value
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-xl font-semibold">
            Personal Expenses
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your day-to-day spending
          </p>
        </div>
        <PersonalExpenseFormDialog userId={userId}>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Expense
          </Button>
        </PersonalExpenseFormDialog>
      </div>

      {/* ── Summary row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">₹{fmt(monthlyTotal)}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Categories Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{uniqueCategoryCount}</p>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalRecords}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Category breakdown ─────────────────────────────────────────────── */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {categoryBreakdown.map((row) => {
                const amount = Number(row.total);
                const widthPct =
                  maxCategoryAmount > 0
                    ? Math.round((amount / maxCategoryAmount) * 100)
                    : 0;
                const colorClass =
                  EXPENSE_CATEGORY_COLORS[row.category] ??
                  EXPENSE_CATEGORY_COLORS.other;

                return (
                  <li key={row.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Badge className={colorClass}>
                          {getCategoryLabel(row.category)}
                        </Badge>
                      </span>
                      <span className="font-medium tabular-nums">
                        ₹{fmt(amount)}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground/20 transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Main table ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>All Expenses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
              <div className="rounded-full bg-muted p-3">
                <ReceiptText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-sm">No expenses yet</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Add your first expense to start tracking your spending.
                </p>
              </div>
              <PersonalExpenseFormDialog userId={userId}>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Expense
                </Button>
              </PersonalExpenseFormDialog>
            </div>
          ) : (
            <div className="px-4 pb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((row) => {
                    const colorClass =
                      EXPENSE_CATEGORY_COLORS[row.category] ??
                      EXPENSE_CATEGORY_COLORS.other;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="truncate max-w-[200px]">{row.title}</p>
                            {row.notes && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {row.notes}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={colorClass}>
                            {getCategoryLabel(row.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {formatDate(row.date)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          ₹{fmt(Number(row.amount))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <PersonalExpenseFormDialog
                              userId={userId}
                              defaultValues={{
                                id: row.id,
                                title: row.title,
                                amount: Number(row.amount),
                                category: row.category,
                                date: toDateInputValue(row.date),
                                notes: row.notes,
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  <path d="m15 5 4 4" />
                                </svg>
                                <span className="sr-only">Edit</span>
                              </Button>
                            </PersonalExpenseFormDialog>
                            <PersonalExpenseDeleteButton
                              userId={userId}
                              expenseId={row.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationBar page={page} totalPages={totalPages} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
