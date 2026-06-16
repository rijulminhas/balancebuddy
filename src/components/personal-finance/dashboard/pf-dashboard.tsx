import { db } from "@/db";
import {
  personalIncomes,
  personalExpenses,
  personalInvestments,
  savingsGoals,
  loans,
} from "@/db/schema";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  LineChart,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Target,
} from "lucide-react";
import { fmt, formatDate } from "@/components/personal-finance/utils";
import {
  INCOME_TYPE_COLORS,
  EXPENSE_CATEGORY_COLORS,
  INCOME_TYPES,
  PERSONAL_EXPENSE_CATEGORIES,
} from "@/components/personal-finance/constants";


function getIncomeTypeLabel(value: string): string {
  return INCOME_TYPES.find((t) => t.value === value)?.label ?? value;
}

function getExpenseCategoryLabel(value: string): string {
  return PERSONAL_EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export async function PfDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    [incomeRow],
    [expenseRow],
    [investmentRow],
    [emiRow],
    goalsRows,
    recentIncomesRows,
    recentExpensesRows,
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
        total: sql<string>`COALESCE(SUM(${personalExpenses.amount}), 0)`,
      })
      .from(personalExpenses)
      .where(
        and(
          eq(personalExpenses.userId, userId),
          gte(personalExpenses.date, currentMonthStart),
          lte(personalExpenses.date, currentMonthEnd)
        )
      ),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(
        and(
          eq(personalInvestments.userId, userId),
          gte(personalInvestments.date, currentMonthStart),
          lte(personalInvestments.date, currentMonthEnd)
        )
      ),

    db
      .select({
        total: sql<string>`COALESCE(SUM(${loans.emiAmount}), 0)`,
      })
      .from(loans)
      .where(and(eq(loans.userId, userId), eq(loans.isActive, true))),

    db
      .select()
      .from(savingsGoals)
      .where(and(eq(savingsGoals.userId, userId), eq(savingsGoals.isCompleted, false)))
      .orderBy(sql`${savingsGoals.createdAt} DESC`)
      .limit(3),

    db
      .select({
        id: personalIncomes.id,
        title: personalIncomes.title,
        amount: personalIncomes.amount,
        incomeType: personalIncomes.incomeType,
        date: personalIncomes.date,
      })
      .from(personalIncomes)
      .where(eq(personalIncomes.userId, userId))
      .orderBy(sql`${personalIncomes.date} DESC`)
      .limit(5),

    db
      .select({
        id: personalExpenses.id,
        title: personalExpenses.title,
        amount: personalExpenses.amount,
        category: personalExpenses.category,
        date: personalExpenses.date,
      })
      .from(personalExpenses)
      .where(eq(personalExpenses.userId, userId))
      .orderBy(sql`${personalExpenses.date} DESC`)
      .limit(5),
  ]);

  const totalIncome = Number(incomeRow.total);
  const totalExpenses = Number(expenseRow.total);
  const totalInvestments = Number(investmentRow.total);
  const totalEMI = Number(emiRow.total);

  const netCashFlow = totalIncome - totalExpenses - totalInvestments - totalEMI;
  const totalSavings = Math.max(0, netCashFlow);

  const monthLabel = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const summaryCards = [
    {
      label: "Total Income",
      value: totalIncome,
      icon: TrendingUp,
      iconClass: "text-green-600",
      iconBg: "bg-green-500/10",
      valueClass: "text-green-600",
      borderClass: "border-green-500/20",
    },
    {
      label: "Total Expenses",
      value: totalExpenses,
      icon: TrendingDown,
      iconClass: "text-destructive",
      iconBg: "bg-destructive/10",
      valueClass: "text-destructive",
      borderClass: "border-destructive/20",
    },
    {
      label: "Investments",
      value: totalInvestments,
      icon: LineChart,
      iconClass: "text-violet-600",
      iconBg: "bg-violet-500/10",
      valueClass: "text-violet-600",
      borderClass: "border-violet-500/20",
    },
    {
      label: "EMI / Loans",
      value: totalEMI,
      icon: CreditCard,
      iconClass: "text-amber-600",
      iconBg: "bg-amber-500/10",
      valueClass: "text-amber-600",
      borderClass: "border-amber-500/20",
    },
    {
      label: "Saved",
      value: totalSavings,
      icon: PiggyBank,
      iconClass: "text-teal-600",
      iconBg: "bg-teal-500/10",
      valueClass: "text-teal-600",
      borderClass: "border-teal-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight">Personal Finance</h1>
        <p className="mt-1.5 text-base text-muted-foreground">
          Your complete financial overview for {monthLabel}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className={`border-border/60 ${card.borderClass}`}
            >
              <CardContent className="pt-5 pb-4">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-2xl ${card.iconBg} mb-3`}
                >
                  <Icon className={`h-4 w-4 ${card.iconClass}`} />
                </div>
                <p className={`text-xl font-black tracking-tight ${card.valueClass}`}>
                  ₹{fmt(card.value)}
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          );
        })}

        <Card
          className={
            netCashFlow >= 0
              ? "border-green-500/20"
              : "border-destructive/20"
          }
        >
          <CardContent className="pt-5 pb-4">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-2xl mb-3 ${
                netCashFlow >= 0 ? "bg-green-500/10" : "bg-destructive/10"
              }`}
            >
              <Wallet
                className={`h-4 w-4 ${
                  netCashFlow >= 0 ? "text-green-600" : "text-destructive"
                }`}
              />
            </div>
            <p
              className={`text-xl font-black tracking-tight ${
                netCashFlow >= 0 ? "text-green-600" : "text-destructive"
              }`}
            >
              ₹{fmt(Math.abs(netCashFlow))}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">
              Net Cash Flow{" "}
              <span
                className={
                  netCashFlow >= 0 ? "text-green-600" : "text-destructive"
                }
              >
                ({netCashFlow >= 0 ? "surplus" : "deficit"})
              </span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-green-500/10">
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
              <CardTitle className="text-base font-bold">Recent Income</CardTitle>
            </div>
            <Link
              href="/personal-finance/income"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl px-2 py-1 hover:bg-muted flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentIncomesRows.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground text-center">
                No income recorded
              </p>
            ) : (
              <div className="space-y-1">
                {recentIncomesRows.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{income.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(income.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <Badge
                        className={`text-xs font-semibold border-0 ${
                          INCOME_TYPE_COLORS[income.incomeType] ??
                          INCOME_TYPE_COLORS.other
                        }`}
                      >
                        {getIncomeTypeLabel(income.incomeType)}
                      </Badge>
                      <span className="text-sm font-bold text-green-600">
                        ₹{fmt(Number(income.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-destructive/10">
                <ArrowDownRight className="h-4 w-4 text-destructive" />
              </div>
              <CardTitle className="text-base font-bold">Recent Expenses</CardTitle>
            </div>
            <Link
              href="/personal-finance/expenses"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl px-2 py-1 hover:bg-muted flex items-center gap-1"
            >
              View All <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentExpensesRows.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground text-center">
                No expenses recorded
              </p>
            ) : (
              <div className="space-y-1">
                {recentExpensesRows.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{expense.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(expense.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <Badge
                        className={`text-xs font-semibold border-0 ${
                          EXPENSE_CATEGORY_COLORS[expense.category] ??
                          EXPENSE_CATEGORY_COLORS.other
                        }`}
                      >
                        {getExpenseCategoryLabel(expense.category)}
                      </Badge>
                      <span className="text-sm font-bold text-destructive">
                        ₹{fmt(Number(expense.amount))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/10">
              <Target className="h-4 w-4 text-teal-600" />
            </div>
            <CardTitle className="text-base font-bold">Savings Goals</CardTitle>
          </div>
          <Link
            href="/personal-finance/savings"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-xl px-2 py-1 hover:bg-muted flex items-center gap-1"
          >
            View All Goals <ArrowUpRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {goalsRows.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground text-center">
              No active savings goals
            </p>
          ) : (
            <div className="space-y-5">
              {goalsRows.map((goal) => {
                const current = Number(goal.currentAmount);
                const target = Number(goal.targetAmount);
                const progressPct = target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{goal.goalName}</p>
                      <span className="text-xs font-bold text-teal-600">
                        {progressPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        ₹{fmt(current)}{" "}
                        <span className="text-muted-foreground/60">/ ₹{fmt(target)}</span>
                      </span>
                      {goal.targetDate && (
                        <span>Target: {formatDate(goal.targetDate)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Add Income",
            href: "/personal-finance/income",
            icon: TrendingUp,
            iconClass: "text-green-600",
            iconBg: "bg-green-500/10",
          },
          {
            label: "Add Expense",
            href: "/personal-finance/expenses",
            icon: TrendingDown,
            iconClass: "text-destructive",
            iconBg: "bg-destructive/10",
          },
          {
            label: "Add Investment",
            href: "/personal-finance/investments",
            icon: LineChart,
            iconClass: "text-violet-600",
            iconBg: "bg-violet-500/10",
          },
          {
            label: "Add Loan",
            href: "/personal-finance/loans",
            icon: CreditCard,
            iconClass: "text-amber-600",
            iconBg: "bg-amber-500/10",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href}>
              <Card className="border-border/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center gap-2 py-5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl ${action.iconBg}`}
                  >
                    <Icon className={`h-5 w-5 ${action.iconClass}`} />
                  </div>
                  <p className="text-sm font-bold">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
