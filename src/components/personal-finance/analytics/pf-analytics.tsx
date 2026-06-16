import { db } from "@/db";
import {
  personalIncomes,
  personalExpenses,
  personalInvestments,
  savingsGoals,
} from "@/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/components/personal-finance/utils";
import {
  INCOME_TYPE_COLORS,
  EXPENSE_CATEGORY_COLORS,
  INVESTMENT_TYPE_COLORS,
  INCOME_TYPES,
  PERSONAL_EXPENSE_CATEGORIES,
  INVESTMENT_TYPES,
} from "@/components/personal-finance/constants";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

function getIncomeTypeLabel(value: string): string {
  return INCOME_TYPES.find((t) => t.value === value)?.label ?? value;
}

function getExpenseCategoryLabel(value: string): string {
  return PERSONAL_EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function getInvestmentTypeLabel(value: string): string {
  return INVESTMENT_TYPES.find((t) => t.value === value)?.label ?? value;
}

function buildMonthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1);
  return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }).replace(" ", " '");
}

function buildMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export async function PfAnalytics() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    monthlyIncomeRows,
    monthlyExpenseRows,
    monthlyInvestmentRows,
    incomeByTypeRows,
    expenseByCategoryRows,
    investmentByTypeRows,
    [currentIncomeRow],
    [currentExpenseRow],
    [currentInvestmentRow],
    [prevIncomeRow],
    [prevExpenseRow],
    [prevInvestmentRow],
    allGoalsRows,
  ] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${personalIncomes.date}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), 0)`,
      })
      .from(personalIncomes)
      .where(and(eq(personalIncomes.userId, userId), gte(personalIncomes.date, sixMonthsAgo)))
      .groupBy(sql`to_char(${personalIncomes.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${personalIncomes.date}, 'YYYY-MM')`),

    db
      .select({
        month: sql<string>`to_char(${personalExpenses.date}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${personalExpenses.amount}), 0)`,
      })
      .from(personalExpenses)
      .where(and(eq(personalExpenses.userId, userId), gte(personalExpenses.date, sixMonthsAgo)))
      .groupBy(sql`to_char(${personalExpenses.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${personalExpenses.date}, 'YYYY-MM')`),

    db
      .select({
        month: sql<string>`to_char(${personalInvestments.date}, 'YYYY-MM')`,
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(and(eq(personalInvestments.userId, userId), gte(personalInvestments.date, sixMonthsAgo)))
      .groupBy(sql`to_char(${personalInvestments.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${personalInvestments.date}, 'YYYY-MM')`),

    db
      .select({
        incomeType: personalIncomes.incomeType,
        total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), 0)`,
      })
      .from(personalIncomes)
      .where(eq(personalIncomes.userId, userId))
      .groupBy(personalIncomes.incomeType)
      .orderBy(sql`SUM(${personalIncomes.amount}) DESC NULLS LAST`),

    db
      .select({
        category: personalExpenses.category,
        total: sql<string>`COALESCE(SUM(${personalExpenses.amount}), 0)`,
      })
      .from(personalExpenses)
      .where(eq(personalExpenses.userId, userId))
      .groupBy(personalExpenses.category)
      .orderBy(sql`SUM(${personalExpenses.amount}) DESC NULLS LAST`),

    db
      .select({
        investmentType: personalInvestments.investmentType,
        total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)`,
      })
      .from(personalInvestments)
      .where(eq(personalInvestments.userId, userId))
      .groupBy(personalInvestments.investmentType)
      .orderBy(sql`SUM(${personalInvestments.amount}) DESC NULLS LAST`),

    db
      .select({ total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), 0)` })
      .from(personalIncomes)
      .where(
        and(
          eq(personalIncomes.userId, userId),
          gte(personalIncomes.date, currentMonthStart),
          lte(personalIncomes.date, currentMonthEnd)
        )
      ),

    db
      .select({ total: sql<string>`COALESCE(SUM(${personalExpenses.amount}), 0)` })
      .from(personalExpenses)
      .where(
        and(
          eq(personalExpenses.userId, userId),
          gte(personalExpenses.date, currentMonthStart),
          lte(personalExpenses.date, currentMonthEnd)
        )
      ),

    db
      .select({ total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)` })
      .from(personalInvestments)
      .where(
        and(
          eq(personalInvestments.userId, userId),
          gte(personalInvestments.date, currentMonthStart),
          lte(personalInvestments.date, currentMonthEnd)
        )
      ),

    db
      .select({ total: sql<string>`COALESCE(SUM(${personalIncomes.amount}), 0)` })
      .from(personalIncomes)
      .where(
        and(
          eq(personalIncomes.userId, userId),
          gte(personalIncomes.date, prevMonthStart),
          lte(personalIncomes.date, prevMonthEnd)
        )
      ),

    db
      .select({ total: sql<string>`COALESCE(SUM(${personalExpenses.amount}), 0)` })
      .from(personalExpenses)
      .where(
        and(
          eq(personalExpenses.userId, userId),
          gte(personalExpenses.date, prevMonthStart),
          lte(personalExpenses.date, prevMonthEnd)
        )
      ),

    db
      .select({ total: sql<string>`COALESCE(SUM(${personalInvestments.amount}), 0)` })
      .from(personalInvestments)
      .where(
        and(
          eq(personalInvestments.userId, userId),
          gte(personalInvestments.date, prevMonthStart),
          lte(personalInvestments.date, prevMonthEnd)
        )
      ),

    db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId)),
  ]);

  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: buildMonthKey(d.getFullYear(), d.getMonth()),
      label: buildMonthLabel(d.getFullYear(), d.getMonth()),
    });
  }

  const incomeMap = new Map(monthlyIncomeRows.map((r) => [r.month, Number(r.total)]));
  const expenseMap = new Map(monthlyExpenseRows.map((r) => [r.month, Number(r.total)]));
  const investmentMap = new Map(monthlyInvestmentRows.map((r) => [r.month, Number(r.total)]));

  const trendData = months.map((m) => ({
    label: m.label,
    income: incomeMap.get(m.key) ?? 0,
    expenses: expenseMap.get(m.key) ?? 0,
    investments: investmentMap.get(m.key) ?? 0,
  }));

  const currentIncome = Number(currentIncomeRow.total);
  const currentExpenses = Number(currentExpenseRow.total);
  const currentInvestments = Number(currentInvestmentRow.total);
  const prevIncome = Number(prevIncomeRow.total);
  const prevExpenses = Number(prevExpenseRow.total);
  const prevInvestments = Number(prevInvestmentRow.total);

  function calcPct(current: number, prev: number): number | null {
    if (prev < 0.005) return null;
    return ((current - prev) / prev) * 100;
  }

  const incomePct = calcPct(currentIncome, prevIncome);
  const expensesPct = calcPct(currentExpenses, prevExpenses);
  const investmentsPct = calcPct(currentInvestments, prevInvestments);

  const totalIncomeAllTime = incomeByTypeRows.reduce((s, r) => s + Number(r.total), 0);
  const totalExpensesAllTime = expenseByCategoryRows.reduce((s, r) => s + Number(r.total), 0);
  const totalInvestmentsAllTime = investmentByTypeRows.reduce((s, r) => s + Number(r.total), 0);

  const totalGoals = allGoalsRows.length;
  const completedGoals = allGoalsRows.filter((g) => g.isCompleted).length;
  const totalTargetAmount = allGoalsRows.reduce((s, g) => s + Number(g.targetAmount), 0);
  const totalSavedAmount = allGoalsRows.reduce((s, g) => s + Number(g.currentAmount), 0);
  const overallSavingsPct = totalTargetAmount > 0 ? Math.min(100, (totalSavedAmount / totalTargetAmount) * 100) : 0;

  const maxTrend = Math.max(
    ...trendData.map((d) => Math.max(d.income, d.expenses, d.investments)),
    1
  );

  const comparisonCards = [
    {
      label: "Income",
      current: currentIncome,
      prev: prevIncome,
      pct: incomePct,
      icon: TrendingUp,
      positiveIsGood: true,
      iconBg: "bg-green-500/10",
      iconClass: "text-green-600",
      valueClass: "text-green-600",
      borderClass: "border-green-500/20",
    },
    {
      label: "Expenses",
      current: currentExpenses,
      prev: prevExpenses,
      pct: expensesPct,
      icon: TrendingDown,
      positiveIsGood: false,
      iconBg: "bg-destructive/10",
      iconClass: "text-destructive",
      valueClass: "text-destructive",
      borderClass: "border-destructive/20",
    },
    {
      label: "Investments",
      current: currentInvestments,
      prev: prevInvestments,
      pct: investmentsPct,
      icon: LineChart,
      positiveIsGood: true,
      iconBg: "bg-violet-500/10",
      iconClass: "text-violet-600",
      valueClass: "text-violet-600",
      borderClass: "border-violet-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base font-bold">6-Month Trend</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr>
                  <th className="pb-3 text-left text-xs font-semibold text-muted-foreground w-28"></th>
                  {months.map((m) => (
                    <th
                      key={m.key}
                      className="pb-3 text-right text-xs font-semibold text-muted-foreground"
                    >
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                <tr>
                  <td className="py-3 text-xs font-semibold text-green-600">Income</td>
                  {trendData.map((d, i) => (
                    <td key={i} className="py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-green-600">
                          ₹{fmt(d.income)}
                        </span>
                        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${(d.income / maxTrend) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 text-xs font-semibold text-destructive">Expenses</td>
                  {trendData.map((d, i) => (
                    <td key={i} className="py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-destructive">
                          ₹{fmt(d.expenses)}
                        </span>
                        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-destructive"
                            style={{ width: `${(d.expenses / maxTrend) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 text-xs font-semibold text-violet-600">Investments</td>
                  {trendData.map((d, i) => (
                    <td key={i} className="py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs font-bold text-violet-600">
                          ₹{fmt(d.investments)}
                        </span>
                        <div className="h-1 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${(d.investments / maxTrend) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          This Month vs Last Month
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {comparisonCards.map((card) => {
            const Icon = card.icon;
            const diff = card.current - card.prev;
            const isIncrease = diff > 0.005;
            const isDecrease = diff < -0.005;
            const isGood = card.positiveIsGood ? isIncrease : isDecrease;
            const isBad = card.positiveIsGood ? isDecrease : isIncrease;

            return (
              <Card key={card.label} className={`border-border/60 ${card.borderClass}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl ${card.iconBg}`}
                    >
                      <Icon className={`h-4 w-4 ${card.iconClass}`} />
                    </div>
                    {card.pct !== null && (
                      <div
                        className={`flex items-center gap-0.5 text-xs font-bold ${
                          isGood
                            ? "text-green-600"
                            : isBad
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {isIncrease ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : isDecrease ? (
                          <ArrowDownRight className="h-3 w-3" />
                        ) : null}
                        {Math.abs(card.pct).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <p className={`text-xl font-black tracking-tight ${card.valueClass}`}>
                    ₹{fmt(card.current)}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                    {card.label} this month
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Last month:{" "}
                    <span className="font-semibold">₹{fmt(card.prev)}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          All-Time Breakdown
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-green-500/10">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle className="text-base font-bold">Income Sources</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {incomeByTypeRows.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground text-center">
                  No income recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {incomeByTypeRows.map((row) => {
                    const amount = Number(row.total);
                    const pct = totalIncomeAllTime > 0 ? (amount / totalIncomeAllTime) * 100 : 0;
                    return (
                      <div key={row.incomeType} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-xs font-semibold border-0 ${
                              INCOME_TYPE_COLORS[row.incomeType] ?? INCOME_TYPE_COLORS.other
                            }`}
                          >
                            {getIncomeTypeLabel(row.incomeType)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-600">
                              ₹{fmt(amount)}
                            </span>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Total</span>
                    <span className="text-sm font-black text-green-600">
                      ₹{fmt(totalIncomeAllTime)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-destructive/10">
                  <PieChart className="h-4 w-4 text-destructive" />
                </div>
                <CardTitle className="text-base font-bold">Expense Categories</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {expenseByCategoryRows.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground text-center">
                  No expenses recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {expenseByCategoryRows.map((row) => {
                    const amount = Number(row.total);
                    const pct = totalExpensesAllTime > 0 ? (amount / totalExpensesAllTime) * 100 : 0;
                    return (
                      <div key={row.category} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-xs font-semibold border-0 ${
                              EXPENSE_CATEGORY_COLORS[row.category] ?? EXPENSE_CATEGORY_COLORS.other
                            }`}
                          >
                            {getExpenseCategoryLabel(row.category)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-destructive">
                              ₹{fmt(amount)}
                            </span>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-destructive"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Total</span>
                    <span className="text-sm font-black text-destructive">
                      ₹{fmt(totalExpensesAllTime)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/10">
                  <LineChart className="h-4 w-4 text-violet-600" />
                </div>
                <CardTitle className="text-base font-bold">Investment Types</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {investmentByTypeRows.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground text-center">
                  No investments recorded
                </p>
              ) : (
                <div className="space-y-3">
                  {investmentByTypeRows.map((row) => {
                    const amount = Number(row.total);
                    const pct =
                      totalInvestmentsAllTime > 0
                        ? (amount / totalInvestmentsAllTime) * 100
                        : 0;
                    return (
                      <div key={row.investmentType} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Badge
                            className={`text-xs font-semibold border-0 ${
                              INVESTMENT_TYPE_COLORS[row.investmentType] ??
                              INVESTMENT_TYPE_COLORS.other
                            }`}
                          >
                            {getInvestmentTypeLabel(row.investmentType)}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-violet-600">
                              ₹{fmt(amount)}
                            </span>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                              {pct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Total</span>
                    <span className="text-sm font-black text-violet-600">
                      ₹{fmt(totalInvestmentsAllTime)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-teal-500/10">
              <BarChart3 className="h-4 w-4 text-teal-600" />
            </div>
            <CardTitle className="text-base font-bold">Savings Goals Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {totalGoals === 0 ? (
            <p className="py-4 text-sm text-muted-foreground text-center">
              No savings goals created yet
            </p>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Total Goals</p>
                  <p className="text-2xl font-black tracking-tight">{totalGoals}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Completed</p>
                  <p className="text-2xl font-black tracking-tight text-green-600">
                    {completedGoals}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Total Target</p>
                  <p className="text-2xl font-black tracking-tight">
                    ₹{fmt(totalTargetAmount)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Total Saved</p>
                  <p className="text-2xl font-black tracking-tight text-teal-600">
                    ₹{fmt(totalSavedAmount)}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Overall Progress</p>
                  <span className="text-sm font-black text-teal-600">
                    {overallSavingsPct.toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{ width: `${overallSavingsPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>₹{fmt(totalSavedAmount)} saved</span>
                  <span>₹{fmt(totalTargetAmount)} target</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
