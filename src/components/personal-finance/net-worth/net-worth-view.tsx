import { db } from "@/db";
import { personalInvestments, savingsGoals, loans } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Landmark,
  PiggyBank,
  LineChart,
  CreditCard,
  Car,
} from "lucide-react";
import { fmt } from "@/components/personal-finance/utils";
import {
  INVESTMENT_TYPE_COLORS,
  INVESTMENT_TYPES,
  LOAN_TYPE_COLORS,
  LOAN_TYPES,
} from "@/components/personal-finance/constants";

function getInvestmentTypeLabel(value: string): string {
  return INVESTMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function getLoanTypeLabel(value: string): string {
  return LOAN_TYPES.find((t) => t.value === value)?.label ?? value;
}

export async function NetWorthView() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [
    [investmentRow],
    [savingsRow],
    [loansRow],
    [emiRow],
    [loanAssetsRow],
    investmentsByType,
    loansList,
  ] = await Promise.all([
    db
      .select({
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(eq(personalInvestments.userId, userId)),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${savingsGoals.currentAmount}), 0)`,
      })
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId)),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${loans.outstandingAmount}), 0)`,
      })
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.isActive, true))),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${loans.emiAmount}), 0)`,
      })
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.isActive, true))),

    // Sum of original loan principals = the asset value of everything financed
    db
      .select({
        total: sql<string>`COALESCE(SUM(${loans.totalAmount}), 0)`,
      })
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.isActive, true))),

    db
      .select({
        investmentType: personalInvestments.investmentType,
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(eq(personalInvestments.userId, userId))
      .groupBy(personalInvestments.investmentType)
      .orderBy(sql`SUM(${personalInvestments.amount}) DESC`),

    db
      .select({
        id: loans.id,
        loanName: loans.loanName,
        loanType: loans.loanType,
        totalAmount: loans.totalAmount,
        outstandingAmount: loans.outstandingAmount,
        emiAmount: loans.emiAmount,
      })
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.isActive, true)))
      .orderBy(sql`${loans.outstandingAmount} DESC`),
  ]);

  const totalInvestments = Number(investmentRow.total);
  const totalSavings = Number(savingsRow.total);
  const totalLoans = Number(loansRow.total);
  const totalEMIBurden = Number(emiRow.total);
  // Loan principal = the asset you purchased (car, home, etc.) with each loan
  const totalLoanAssets = Number(loanAssetsRow.total);

  // Assets = liquid/investment assets + the assets financed by loans (at original purchase price)
  const totalAssets = totalInvestments + totalSavings + totalLoanAssets;
  // Liabilities = only the outstanding balance remaining on each loan
  const totalLiabilities = totalLoans;
  // Net Worth = equity in all assets (what you truly own)
  const netWorth = totalAssets - totalLiabilities;

  const isPositive = netWorth > 0;
  const isNegative = netWorth < 0;

  const netWorthColorClass = isPositive
    ? "text-green-600"
    : isNegative
    ? "text-destructive"
    : "text-muted-foreground";

  const netWorthBorderClass = isPositive
    ? "border-green-500/20"
    : isNegative
    ? "border-destructive/20"
    : "border-border/60";

  const netWorthBgClass = isPositive
    ? "bg-green-500/5"
    : isNegative
    ? "bg-destructive/5"
    : "bg-muted/30";

  const NetWorthIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const debtToAssetRatio =
    totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;

  const debtRatioColorClass =
    debtToAssetRatio > 50
      ? "text-destructive"
      : debtToAssetRatio >= 20
      ? "text-amber-600"
      : "text-green-600";

  const debtRatioBgClass =
    debtToAssetRatio > 50
      ? "bg-destructive/10"
      : debtToAssetRatio >= 20
      ? "bg-amber-500/10"
      : "bg-green-500/10";

  const debtRatioIconClass =
    debtToAssetRatio > 50
      ? "text-destructive"
      : debtToAssetRatio >= 20
      ? "text-amber-600"
      : "text-green-600";

  const investmentCoverage =
    totalLiabilities > 0
      ? (totalInvestments / totalLiabilities) * 100
      : null;

  return (
    <div className="space-y-6">
      <Card className={`${netWorthBorderClass} ${netWorthBgClass}`}>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                isPositive
                  ? "bg-green-500/10"
                  : isNegative
                  ? "bg-destructive/10"
                  : "bg-muted"
              }`}
            >
              <NetWorthIcon
                className={`h-6 w-6 ${netWorthColorClass}`}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                Current Net Worth
              </p>
              <p className={`text-4xl font-black tracking-tight mt-1 ${netWorthColorClass}`}>
                ₹{fmt(Math.abs(netWorth))}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Total Assets: ₹{fmt(totalAssets)} &mdash; Total Liabilities: ₹{fmt(totalLiabilities)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-green-500/10">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-base font-bold">Total Assets</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-muted/40">
                <div className="flex items-center gap-2">
                  <LineChart className="h-4 w-4 text-violet-600" />
                  <span className="text-sm font-medium">Investments</span>
                </div>
                <span className="text-sm font-bold text-violet-600">
                  ₹{fmt(totalInvestments)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-muted/40">
                <div className="flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-medium">Savings</span>
                </div>
                <span className="text-sm font-bold text-teal-600">
                  ₹{fmt(totalSavings)}
                </span>
              </div>
              {totalLoanAssets > 0 && (
                <div className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-muted/40">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Car className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium">Financed Assets</span>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Original loan principal (car, home, etc.)
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-blue-600 shrink-0 ml-2">
                    ₹{fmt(totalLoanAssets)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-sm font-bold">Total Assets</span>
              <span className="text-sm font-black text-green-600">
                = ₹{fmt(totalAssets)}
              </span>
            </div>

            {investmentsByType.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Investment Breakdown
                </p>
                {investmentsByType.map((row) => {
                  const typeTotal = Number(row.total);
                  const pct =
                    totalInvestments > 0
                      ? Math.round((typeTotal / totalInvestments) * 100)
                      : 0;
                  const colorClass =
                    INVESTMENT_TYPE_COLORS[row.investmentType] ??
                    INVESTMENT_TYPE_COLORS.other;
                  return (
                    <div key={row.investmentType} className="flex items-center justify-between gap-3">
                      <Badge className={`text-xs font-semibold border-0 ${colorClass} shrink-0`}>
                        {getInvestmentTypeLabel(row.investmentType)}
                      </Badge>
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold shrink-0">
                        ₹{fmt(typeTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-red-500/10">
                <Landmark className="h-4 w-4 text-red-600" />
              </div>
              <CardTitle className="text-base font-bold">Total Liabilities</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loansList.length === 0 ? (
              <div className="rounded-xl bg-green-500/10 px-4 py-5 text-center">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  No outstanding liabilities! Great job.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {loansList.map((loan) => {
                  const outstanding = Number(loan.outstandingAmount);
                  const emi = Number(loan.emiAmount);
                  const colorClass =
                    LOAN_TYPE_COLORS[loan.loanType] ?? LOAN_TYPE_COLORS.other;
                  return (
                    <div
                      key={loan.id}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 bg-muted/40 gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">
                            {loan.loanName}
                          </p>
                          <Badge className={`text-xs font-semibold border-0 ${colorClass} shrink-0`}>
                            {getLoanTypeLabel(loan.loanType)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          EMI: ₹{fmt(emi)}/mo
                        </p>
                      </div>
                      <span className="text-sm font-bold text-destructive shrink-0">
                        ₹{fmt(outstanding)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {loansList.length > 0 && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Total Outstanding</span>
                  <span className="text-sm font-black text-destructive">
                    = ₹{fmt(totalLoans)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      Monthly EMI Burden
                    </span>
                  </div>
                  <span className="text-xs font-bold text-amber-600">
                    ₹{fmt(totalEMIBurden)}/month
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {investmentsByType.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/10">
                <LineChart className="h-4 w-4 text-violet-600" />
              </div>
              <CardTitle className="text-base font-bold">Asset Allocation</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {investmentsByType.map((row) => {
              const typeTotal = Number(row.total);
              const pct =
                totalAssets > 0
                  ? Math.min(100, Math.round((typeTotal / totalAssets) * 100))
                  : 0;
              const colorClass =
                INVESTMENT_TYPE_COLORS[row.investmentType] ??
                INVESTMENT_TYPE_COLORS.other;
              return (
                <div key={row.investmentType} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs font-semibold border-0 ${colorClass}`}>
                        {getInvestmentTypeLabel(row.investmentType)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {pct}% of assets
                      </span>
                    </div>
                    <span className="text-sm font-bold">₹{fmt(typeTotal)}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl ${debtRatioBgClass} mb-3`}
            >
              <Landmark className={`h-4 w-4 ${debtRatioIconClass}`} />
            </div>
            <p className={`text-xl font-black tracking-tight ${debtRatioColorClass}`}>
              {totalAssets > 0 ? `${debtToAssetRatio.toFixed(1)}%` : "—"}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Debt-to-Asset Ratio
            </p>
            {totalAssets > 0 && (
              <p className="text-[10px] font-medium text-muted-foreground mt-1">
                {debtToAssetRatio > 50
                  ? "High — consider reducing liabilities"
                  : debtToAssetRatio >= 20
                  ? "Moderate — manageable debt level"
                  : "Low — healthy financial position"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/10 mb-3">
              <CreditCard className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-xl font-black tracking-tight text-amber-600">
              {totalEMIBurden > 0 ? `₹${fmt(totalEMIBurden)}` : "₹0.00"}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Monthly EMI Burden
            </p>
            {totalEMIBurden > 0 && (
              <p className="text-[10px] font-medium text-muted-foreground mt-1">
                per month across all active loans
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="pt-5 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-500/10 mb-3">
              <LineChart className="h-4 w-4 text-violet-600" />
            </div>
            {investmentCoverage === null ? (
              <>
                <div className="mt-0.5">
                  <Badge className="text-xs font-semibold border-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    No debt
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-2">
                  Investment Coverage
                </p>
              </>
            ) : (
              <>
                <p
                  className={`text-xl font-black tracking-tight ${
                    investmentCoverage >= 100
                      ? "text-green-600"
                      : investmentCoverage >= 50
                      ? "text-amber-600"
                      : "text-destructive"
                  }`}
                >
                  {investmentCoverage.toFixed(1)}%
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Investment Coverage
                </p>
                <p className="text-[10px] font-medium text-muted-foreground mt-1">
                  investments vs. total debt
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
