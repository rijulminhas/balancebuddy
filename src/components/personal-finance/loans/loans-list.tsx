import { db } from "@/db";
import { loans } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  CreditCard,
  Wallet,
  CalendarDays,
  TrendingDown,
} from "lucide-react";
import { fmt, formatDate, toDateInputValue } from "@/components/personal-finance/utils";
import {
  LOAN_TYPES,
  LOAN_TYPE_COLORS,
} from "@/components/personal-finance/constants";
import { LoanFormDialog } from "@/components/personal-finance/loans/loan-form-dialog";
import { LoanDeleteButton } from "@/components/personal-finance/loans/loan-delete-button";

function getLoanTypeLabel(value: string): string {
  return LOAN_TYPES.find((t) => t.value === value)?.label ?? value;
}

export async function LoansList() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [allLoans, [summaryRow]] = await Promise.all([
    // All loans ordered by active first, then newest first
    db
      .select({
        id: loans.id,
        loanName: loans.loanName,
        totalAmount: loans.totalAmount,
        outstandingAmount: loans.outstandingAmount,
        emiAmount: loans.emiAmount,
        loanType: loans.loanType,
        startDate: loans.startDate,
        endDate: loans.endDate,
        notes: loans.notes,
        isActive: loans.isActive,
        createdAt: loans.createdAt,
      })
      .from(loans)
      .where(eq(loans.userId, userId))
      .orderBy(desc(loans.isActive), desc(loans.createdAt)),

    // Aggregate stats
    db
      .select({
        totalCount: sql<number>`COUNT(*)::int`,
        activeCount: sql<number>`COUNT(*) FILTER (WHERE ${loans.isActive} = true)::int`,
        closedCount: sql<number>`COUNT(*) FILTER (WHERE ${loans.isActive} = false)::int`,
        totalOutstanding: sql<string>`COALESCE(SUM(${loans.outstandingAmount}) FILTER (WHERE ${loans.isActive} = true), 0)`,
        totalEmi: sql<string>`COALESCE(SUM(${loans.emiAmount}) FILTER (WHERE ${loans.isActive} = true), 0)`,
      })
      .from(loans)
      .where(eq(loans.userId, userId)),
  ]);

  const activeCount = summaryRow.activeCount ?? 0;
  const closedCount = summaryRow.closedCount ?? 0;
  const totalOutstanding = Number(summaryRow.totalOutstanding ?? 0);
  const totalEmi = Number(summaryRow.totalEmi ?? 0);
  const totalCount = summaryRow.totalCount ?? 0;

  const summaryCards = [
    {
      label: "Active Loans",
      value: activeCount.toString(),
      icon: CreditCard,
      iconBg: "bg-blue-500/10",
      iconClass: "text-blue-600",
      valueClass: "text-blue-600",
      isRaw: true,
    },
    {
      label: "Total Outstanding",
      value: totalOutstanding,
      icon: TrendingDown,
      iconBg: "bg-red-500/10",
      iconClass: "text-red-600",
      valueClass: "text-red-600",
      isRaw: false,
    },
    {
      label: "Monthly EMI Burden",
      value: totalEmi,
      icon: Wallet,
      iconBg: "bg-orange-500/10",
      iconClass: "text-orange-600",
      valueClass: "text-orange-600",
      isRaw: false,
    },
    {
      label: "Closed Loans",
      value: closedCount.toString(),
      icon: CalendarDays,
      iconBg: "bg-muted",
      iconClass: "text-muted-foreground",
      valueClass: "text-foreground",
      isRaw: true,
    },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Loans &amp; EMI
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCount} loan{totalCount !== 1 ? "s" : ""} total
          </p>
        </div>
        <LoanFormDialog userId={userId}>
          <Button size="sm" className="rounded-xl gap-1.5">
            <Plus className="h-4 w-4" />
            Add Loan
          </Button>
        </LoanFormDialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                <p
                  className={`text-xl font-black tracking-tight ${card.valueClass}`}
                >
                  {card.isRaw
                    ? card.value
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

      {/* Loans Grid / Empty State */}
      {totalCount === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CreditCard className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">No loans tracked yet</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Add your first loan to start tracking repayment progress.
            </p>
            <LoanFormDialog userId={userId}>
              <Button size="sm" className="rounded-xl gap-1.5">
                <Plus className="h-4 w-4" />
                Add Loan
              </Button>
            </LoanFormDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {allLoans.map((loan) => {
            const total = Number(loan.totalAmount);
            const outstanding = Number(loan.outstandingAmount);
            const emi = Number(loan.emiAmount);
            const repaid = total > 0 ? total - outstanding : 0;
            const pct = total > 0 ? Math.min(100, Math.round((repaid / total) * 100)) : 0;
            const colorClass =
              LOAN_TYPE_COLORS[loan.loanType] ?? LOAN_TYPE_COLORS.other;

            return (
              <Card
                key={loan.id}
                className={`border-border/60 ${!loan.isActive ? "opacity-70" : ""}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold leading-snug truncate">
                        {loan.loanName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge
                          className={`text-xs font-semibold border-0 ${colorClass}`}
                        >
                          {getLoanTypeLabel(loan.loanType)}
                        </Badge>
                        {loan.isActive ? (
                          <Badge className="text-xs font-semibold border-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="text-xs font-semibold border-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            Closed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <LoanFormDialog
                        userId={userId}
                        defaultValues={{
                          id: loan.id,
                          loanName: loan.loanName,
                          totalAmount: total,
                          outstandingAmount: outstanding,
                          emiAmount: emi,
                          loanType: loan.loanType,
                          startDate: toDateInputValue(loan.startDate),
                          endDate: loan.endDate
                            ? toDateInputValue(loan.endDate)
                            : null,
                          notes: loan.notes,
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs rounded-lg"
                        >
                          Edit
                        </Button>
                      </LoanFormDialog>
                      <LoanDeleteButton userId={userId} loanId={loan.id} />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Amount row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-muted/50 px-2 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Total
                      </p>
                      <p className="text-sm font-bold mt-0.5">
                        ₹{fmt(total)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 px-2 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Outstanding
                      </p>
                      <p className="text-sm font-bold mt-0.5 text-red-600">
                        ₹{fmt(outstanding)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 px-2 py-2">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        EMI/mo
                      </p>
                      <p className="text-sm font-bold mt-0.5 text-orange-600">
                        ₹{fmt(emi)}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Repayment progress
                      </span>
                      <span className="text-xs font-semibold text-emerald-600">
                        Repaid: {pct}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      <span className="font-medium text-foreground">
                        Start:{" "}
                      </span>
                      {formatDate(loan.startDate)}
                    </span>
                    {loan.endDate && (
                      <span>
                        <span className="font-medium text-foreground">
                          End:{" "}
                        </span>
                        {formatDate(loan.endDate)}
                      </span>
                    )}
                  </div>

                  {/* Notes */}
                  {loan.notes && (
                    <p className="text-xs text-muted-foreground truncate">
                      {loan.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
