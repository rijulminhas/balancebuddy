import { db } from "@/db";
import { personalIncomes } from "@/db/schema";
import { eq, desc, sql, count, and, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmt, formatDate, toDateInputValue } from "@/components/personal-finance/utils";
import {
  INCOME_TYPES,
  INCOME_TYPE_COLORS,
  PAGE_SIZE,
} from "@/components/personal-finance/constants";
import { IncomeFormDialog } from "@/components/personal-finance/income/income-form-dialog";
import { IncomeDeleteButton } from "@/components/personal-finance/income/income-delete-button";
import { Plus, TrendingUp, CalendarDays, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaginationBar } from "@/components/ui/pagination-bar";

interface IncomeListProps {
  page: number;
  userId: string;
}

export async function IncomeList({ page, userId }: IncomeListProps) {

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const offset = (page - 1) * PAGE_SIZE;

  const [
    [monthlyRow],
    [allTimeRow],
    [countRow],
    records,
  ] = await Promise.all([
    db
      .select({
        total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), 0)`,
      })
      .from(personalIncomes)
      .where(
        and(
          eq(personalIncomes.userId, userId),
          gte(personalIncomes.date, currentMonthStart),
          lte(personalIncomes.date, currentMonthEnd)
        )
      ),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), 0)`,
      })
      .from(personalIncomes)
      .where(eq(personalIncomes.userId, userId)),

    db
      .select({ total: count() })
      .from(personalIncomes)
      .where(eq(personalIncomes.userId, userId)),

    db
      .select({
        id: personalIncomes.id,
        title: personalIncomes.title,
        amount: personalIncomes.amount,
        incomeType: personalIncomes.incomeType,
        date: personalIncomes.date,
        notes: personalIncomes.notes,
      })
      .from(personalIncomes)
      .where(eq(personalIncomes.userId, userId))
      .orderBy(desc(personalIncomes.date))
      .limit(PAGE_SIZE)
      .offset(offset),
  ]);

  const monthlyTotal = Number(monthlyRow.total);
  const allTimeTotal = Number(allTimeRow.total);
  const totalCount = countRow.total;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const monthLabel = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track all your income sources
          </p>
        </div>
        <IncomeFormDialog userId={userId}>
          <Button className="rounded-xl gap-2">
            <Plus className="h-4 w-4" />
            Add Income
          </Button>
        </IncomeFormDialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-green-500/10 mb-3">
              <CalendarDays className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xl font-black tracking-tight text-green-600">
              ₹{fmt(monthlyTotal)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              This Month ({monthLabel})
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-500/10 mb-3">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xl font-black tracking-tight text-blue-600">
              ₹{fmt(allTimeTotal)}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              All Time
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/10 mb-3">
              <TrendingUp className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-xl font-black tracking-tight text-violet-600">
              {totalCount}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Records
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Income Records</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">No income recorded yet.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Start by adding your first income.
                </p>
              </div>
              <IncomeFormDialog userId={userId}>
                <Button variant="outline" className="rounded-xl gap-2 mt-1">
                  <Plus className="h-4 w-4" />
                  Add Income
                </Button>
              </IncomeFormDialog>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const typeLabel =
                      INCOME_TYPES.find((t) => t.value === record.incomeType)?.label ??
                      record.incomeType;
                    const typeColor =
                      INCOME_TYPE_COLORS[record.incomeType] ?? INCOME_TYPE_COLORS.other;

                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.title}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs font-semibold border-0 ${typeColor}`}>
                            {typeLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          ₹{fmt(Number(record.amount))}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <IncomeFormDialog
                              userId={userId}
                              defaultValues={{
                                id: record.id,
                                title: record.title,
                                amount: Number(record.amount),
                                incomeType: record.incomeType,
                                date: toDateInputValue(record.date),
                                notes: record.notes,
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-3.5 w-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z"
                                  />
                                </svg>
                              </Button>
                            </IncomeFormDialog>
                            <IncomeDeleteButton
                              userId={userId}
                              incomeId={record.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <PaginationBar page={page} totalPages={totalPages} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
