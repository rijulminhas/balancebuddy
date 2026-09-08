import { db } from "@/db";
import { personalInvestments } from "@/db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, BarChart3, Hash, LineChart } from "lucide-react";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { fmt, formatDate, toDateInputValue } from "@/components/personal-finance/utils";
import {
  INVESTMENT_TYPES,
  INVESTMENT_TYPE_COLORS,
  PAGE_SIZE,
} from "@/components/personal-finance/constants";
import { InvestmentFormDialog } from "@/components/personal-finance/investments/investment-form-dialog";
import { InvestmentDeleteButton } from "@/components/personal-finance/investments/investment-delete-button";

function getInvestmentTypeLabel(value: string): string {
  return INVESTMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

export async function InvestmentsList({ page }: { page: number }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(
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
    typeBreakdownRows,
    [countRow],
    records,
  ] = await Promise.all([
    // Monthly total (current month)
    db
      .select({
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(
        and(
          eq(personalInvestments.userId, userId),
          gte(personalInvestments.date, monthStart),
          lte(personalInvestments.date, monthEnd)
        )
      ),

    // All-time total
    db
      .select({
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(eq(personalInvestments.userId, userId)),

    // Type breakdown: GROUP BY investmentType, SUM amount, ORDER BY SUM DESC
    db
      .select({
        investmentType: personalInvestments.investmentType,
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(eq(personalInvestments.userId, userId))
      .groupBy(personalInvestments.investmentType)
      .orderBy(sql`SUM(${personalInvestments.amount}) DESC`),

    // Total count
    db
      .select({ total: count() })
      .from(personalInvestments)
      .where(eq(personalInvestments.userId, userId)),

    // Paginated list
    db
      .select({
        id: personalInvestments.id,
        investmentName: personalInvestments.investmentName,
        amount: personalInvestments.amount,
        investmentType: personalInvestments.investmentType,
        date: personalInvestments.date,
        notes: personalInvestments.notes,
      })
      .from(personalInvestments)
      .where(eq(personalInvestments.userId, userId))
      .orderBy(desc(personalInvestments.date))
      .limit(PAGE_SIZE)
      .offset(offset),
  ]);

  const monthlyTotal = Number(monthlyRow.total);
  const allTimeTotal = Number(allTimeRow.total);
  const totalCount = countRow.total;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Largest type total for progress bar scaling
  const largestTypeTotal =
    typeBreakdownRows.length > 0 ? Number(typeBreakdownRows[0].total) : 0;

  const summaryCards = [
    {
      label: "This Month",
      value: monthlyTotal,
      icon: TrendingUp,
      iconBg: "bg-violet-500/10",
      iconClass: "text-violet-600",
      valueClass: "text-violet-600",
    },
    {
      label: "All Time",
      value: allTimeTotal,
      icon: BarChart3,
      iconBg: "bg-blue-500/10",
      iconClass: "text-blue-600",
      valueClass: "text-blue-600",
    },
    {
      label: "Total Records",
      value: totalCount,
      icon: Hash,
      iconBg: "bg-muted",
      iconClass: "text-muted-foreground",
      valueClass: "text-foreground",
      isCount: true,
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCount} record{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <InvestmentFormDialog userId={userId}>
          <Button size="sm" className="rounded-xl gap-1.5">
            <Plus className="h-4 w-4" />
            Add Investment
          </Button>
        </InvestmentFormDialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="border-border/60">
              <CardContent className="pt-5 pb-4">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl ${card.iconBg} mb-3`}
                >
                  <Icon className={`h-4 w-4 ${card.iconClass}`} />
                </div>
                <p className={`text-xl font-black tracking-tight ${card.valueClass}`}>
                  {"isCount" in card && card.isCount
                    ? card.value.toString()
                    : `₹${fmt(card.value as number)}`}
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Investment Type Breakdown */}
      {typeBreakdownRows.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/10">
                <LineChart className="h-4 w-4 text-violet-600" />
              </div>
              <CardTitle className="text-base font-bold">By Type</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {typeBreakdownRows.map((row) => {
              const typeTotal = Number(row.total);
              const pct =
                largestTypeTotal > 0
                  ? Math.round((typeTotal / largestTypeTotal) * 100)
                  : 0;
              const colorClass =
                INVESTMENT_TYPE_COLORS[row.investmentType] ??
                INVESTMENT_TYPE_COLORS.other;

              return (
                <div key={row.investmentType} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge
                      className={`text-xs font-semibold border-0 ${colorClass}`}
                    >
                      {getInvestmentTypeLabel(row.investmentType)}
                    </Badge>
                    <span className="text-sm font-bold">₹{fmt(typeTotal)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Records Table / Empty State */}
      {totalCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TrendingUp className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">No investments yet</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Start tracking your investments to see your portfolio grow.
            </p>
            <InvestmentFormDialog userId={userId}>
              <Button size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-4 w-4" />
                Add Investment
              </Button>
            </InvestmentFormDialog>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/60">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">All Investments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => {
                    const colorClass =
                      INVESTMENT_TYPE_COLORS[record.investmentType] ??
                      INVESTMENT_TYPE_COLORS.other;
                    return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium text-sm">
                          {record.investmentName}
                          {record.notes && (
                            <p className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">
                              {record.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs font-semibold border-0 ${colorClass}`}
                          >
                            {getInvestmentTypeLabel(record.investmentType)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(record.date)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-violet-600">
                          ₹{fmt(Number(record.amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <InvestmentFormDialog
                              userId={userId}
                              defaultValues={{
                                id: record.id,
                                investmentName: record.investmentName,
                                amount: Number(record.amount),
                                investmentType: record.investmentType,
                                date: toDateInputValue(record.date),
                                notes: record.notes,
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs rounded-lg"
                              >
                                Edit
                              </Button>
                            </InvestmentFormDialog>
                            <InvestmentDeleteButton
                              userId={userId}
                              investmentId={record.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="px-6 pb-4">
              <PaginationBar page={page} totalPages={totalPages} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
