import { db } from "@/db";
import { savingsGoals } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  CheckCircle2,
  PiggyBank,
  TrendingUp,
  Pencil,
  CalendarClock,
  Wallet,
  AlertCircle,
  ListChecks,
} from "lucide-react";
import { fmt, fmtCompact, formatDate } from "@/components/personal-finance/utils";
import { SavingsGoalFormDialog } from "./savings-goal-form-dialog";
import { UpdateProgressDialog } from "./update-progress-dialog";
import { SavingsGoalDeleteButton } from "./savings-goal-delete-button";

// ─── Types & Helpers ──────────────────────────────────────────────────────────

type GoalStatus =
  | "completed"
  | "on_track"
  | "slightly_behind"
  | "behind_schedule"
  | "no_date";

function getRemainingMonths(today: Date, targetDate: Date): number {
  if (targetDate.getTime() <= today.getTime()) return 0;
  const y = targetDate.getFullYear() - today.getFullYear();
  const m = targetDate.getMonth() - today.getMonth();
  const d = targetDate.getDate() - today.getDate();
  return Math.max(0, y * 12 + m + (d > 0 ? 1 : 0));
}

function getGoalStatus(
  current: number,
  target: number,
  targetDate: Date | null,
  isCompleted: boolean,
  createdAt: Date,
  today: Date
): GoalStatus {
  if (isCompleted || current >= target) return "completed";
  if (!targetDate) return "no_date";

  const targetTime = new Date(targetDate).getTime();
  const todayTime = today.getTime();
  const createdTime = new Date(createdAt).getTime();

  if (targetTime <= todayTime) return "behind_schedule";

  const totalDuration = targetTime - createdTime;
  const elapsedDuration = Math.max(0, todayTime - createdTime);

  if (totalDuration <= 0) return "behind_schedule";

  const timeProgressPct = Math.min(100, (elapsedDuration / totalDuration) * 100);
  const savingsProgressPct = target > 0 ? (current / target) * 100 : 0;

  if (savingsProgressPct >= timeProgressPct) return "on_track";
  if (savingsProgressPct >= timeProgressPct * 0.75) return "slightly_behind";
  return "behind_schedule";
}

const STATUS_CONFIG: Record<
  GoalStatus,
  { label: string; badgeClass: string; barClass: string; pctClass: string }
> = {
  completed: {
    label: "Completed",
    badgeClass:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    barClass: "bg-green-500",
    pctClass: "text-green-600",
  },
  on_track: {
    label: "On Track",
    badgeClass:
      "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    barClass: "bg-teal-500",
    pctClass: "text-teal-600",
  },
  slightly_behind: {
    label: "Slightly Behind",
    badgeClass:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    barClass: "bg-amber-500",
    pctClass: "text-amber-600",
  },
  behind_schedule: {
    label: "Behind Schedule",
    badgeClass:
      "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    barClass: "bg-destructive",
    pctClass: "text-destructive",
  },
  no_date: {
    label: "Active",
    badgeClass: "bg-muted text-muted-foreground",
    barClass: "bg-primary",
    pctClass: "text-primary",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export async function SavingsList() {
  const session = await getSession();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const today = new Date();

  const [goals, [stats]] = await Promise.all([
    db
      .select()
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId))
      .orderBy(
        sql`${savingsGoals.isCompleted} ASC`,
        sql`${savingsGoals.createdAt} DESC`
      ),

    db
      .select({
        total: sql<string>`COUNT(*)`,
        completed: sql<string>`COUNT(*) FILTER (WHERE ${savingsGoals.isCompleted} = true)`,
        totalTarget: sql<string>`COALESCE(SUM(${savingsGoals.targetAmount}), 0)`,
        totalSaved: sql<string>`COALESCE(SUM(${savingsGoals.currentAmount}), 0)`,
      })
      .from(savingsGoals)
      .where(eq(savingsGoals.userId, userId)),
  ]);

  const totalGoals = Number(stats.total);
  const completedGoals = Number(stats.completed);
  const activeGoals = totalGoals - completedGoals;
  const totalTarget = Number(stats.totalTarget);
  const totalSaved = Number(stats.totalSaved);

  const summaryCards = [
    {
      label: "Total Goals",
      value: String(totalGoals),
      icon: ListChecks,
      iconClass: "text-indigo-600",
      iconBg: "bg-indigo-500/10",
      valueClass: "text-indigo-600",
      borderClass: "border-indigo-500/20",
      isAmount: false,
    },
    {
      label: "Active Goals",
      value: String(activeGoals),
      icon: Target,
      iconClass: "text-teal-600",
      iconBg: "bg-teal-500/10",
      valueClass: "text-teal-600",
      borderClass: "border-teal-500/20",
      isAmount: false,
    },
    {
      label: "Completed",
      value: String(completedGoals),
      icon: CheckCircle2,
      iconClass: "text-green-600",
      iconBg: "bg-green-500/10",
      valueClass: "text-green-600",
      borderClass: "border-green-500/20",
      isAmount: false,
    },
    {
      label: "Total Target",
      value: fmtCompact(totalTarget),
      icon: TrendingUp,
      iconClass: "text-violet-600",
      iconBg: "bg-violet-500/10",
      valueClass: "text-violet-600",
      borderClass: "border-violet-500/20",
      isAmount: true,
    },
    {
      label: "Total Saved",
      value: fmtCompact(totalSaved),
      icon: PiggyBank,
      iconClass: "text-primary",
      iconBg: "bg-primary/10",
      valueClass: "text-primary",
      borderClass: "border-primary/20",
      isAmount: true,
    },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Savings Goals</h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            Track your progress towards every financial milestone.
          </p>
        </div>
        <SavingsGoalFormDialog userId={userId}>
          <Button className="rounded-xl gap-2">
            <span className="text-base leading-none">+</span> New Goal
          </Button>
        </SavingsGoalFormDialog>
      </div>

      {/* Summary Cards — 5 stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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
                <p
                  className={`text-xl font-black tracking-tight ${card.valueClass}`}
                >
                  {card.isAmount ? `₹${card.value}` : card.value}
                </p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {card.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <PiggyBank className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">No savings goals yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first goal to start tracking your savings.
              </p>
            </div>
            <SavingsGoalFormDialog userId={userId}>
              <Button variant="outline" className="rounded-xl mt-1">
                + New Goal
              </Button>
            </SavingsGoalFormDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const current = Number(goal.currentAmount);
            const target = Number(goal.targetAmount);
            const remaining = Math.max(0, target - current);
            const progressPct =
              target > 0 ? Math.min(100, (current / target) * 100) : 0;

            const targetDate = goal.targetDate
              ? new Date(goal.targetDate)
              : null;
            const monthsLeft = targetDate
              ? getRemainingMonths(today, targetDate)
              : null;
            const requiredMonthlySavings =
              monthsLeft !== null && monthsLeft > 0
                ? remaining / monthsLeft
                : null;

            const daysRemaining =
              targetDate && !goal.isCompleted
                ? Math.ceil(
                    (targetDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : null;

            const status = getGoalStatus(
              current,
              target,
              targetDate,
              goal.isCompleted,
              new Date(goal.createdAt),
              today
            );

            const statusCfg = STATUS_CONFIG[status];

            const defaultValues = {
              id: goal.id,
              goalName: goal.goalName,
              targetAmount: target,
              currentAmount: current,
              targetDate: goal.targetDate
                ? new Date(goal.targetDate).toISOString().slice(0, 10)
                : null,
              notes: goal.notes,
            };

            return (
              <Card
                key={goal.id}
                className={`border-border/60 flex flex-col ${
                  goal.isCompleted ? "opacity-80" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold leading-tight truncate min-w-0 flex-1">
                      {goal.goalName}
                    </h3>
                    <Badge
                      className={`shrink-0 border-0 text-[11px] font-semibold ${statusCfg.badgeClass}`}
                    >
                      {statusCfg.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4 flex-1">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        ₹{fmt(current)}
                        <span className="text-muted-foreground/60">
                          {" "}
                          / ₹{fmt(target)}
                        </span>
                      </span>
                      <span className={`font-bold ${statusCfg.pctClass}`}>
                        {progressPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${statusCfg.barClass}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Grid: Target / Saved / Remaining / Months Left */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Target
                      </p>
                      <p className="text-sm font-bold mt-0.5">
                        ₹{fmtCompact(target)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Saved
                      </p>
                      <p className="text-sm font-bold mt-0.5 text-teal-600">
                        ₹{fmtCompact(current)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Remaining
                      </p>
                      <p
                        className={`text-sm font-bold mt-0.5 ${
                          status === "completed"
                            ? "text-green-600"
                            : remaining > 0
                            ? "text-destructive"
                            : "text-green-600"
                        }`}
                      >
                        {status === "completed" ? "₹0.00" : `₹${fmtCompact(remaining)}`}
                      </p>
                    </div>

                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Months Left
                      </p>
                      {monthsLeft !== null ? (
                        <p
                          className={`text-sm font-bold mt-0.5 ${
                            monthsLeft === 0
                              ? "text-destructive"
                              : monthsLeft <= 2
                              ? "text-amber-600"
                              : ""
                          }`}
                        >
                          {monthsLeft === 0 ? "Overdue" : `${monthsLeft} mo`}
                        </p>
                      ) : (
                        <p className="text-sm font-bold mt-0.5 text-muted-foreground">
                          —
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Required Monthly Savings */}
                  {requiredMonthlySavings !== null &&
                    status !== "completed" && (
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-primary/5 px-3 py-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Wallet className="h-3.5 w-3.5 shrink-0" />
                          <span>Required / month</span>
                        </div>
                        <span className="text-sm font-black text-primary">
                          ₹{fmt(requiredMonthlySavings)}
                        </span>
                      </div>
                    )}

                  {/* Overdue warning */}
                  {monthsLeft === 0 && status === "behind_schedule" && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      <span>Past target date — consider updating your goal.</span>
                    </div>
                  )}

                  {/* Target date + days remaining */}
                  {targetDate && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      <span>Target: {formatDate(targetDate)}</span>
                      {daysRemaining !== null && (
                        <span
                          className={`ml-auto font-semibold ${
                            daysRemaining < 0
                              ? "text-destructive"
                              : daysRemaining === 0
                              ? "text-amber-600"
                              : daysRemaining <= 30
                              ? "text-amber-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          {daysRemaining < 0
                            ? `${Math.abs(daysRemaining)}d overdue`
                            : daysRemaining === 0
                            ? "Due today"
                            : `${daysRemaining}d left`}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {goal.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {goal.notes}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-auto flex items-center gap-1 pt-1">
                    {!goal.isCompleted && (
                      <UpdateProgressDialog
                        userId={userId}
                        goalId={goal.id}
                        goalName={goal.goalName}
                        targetAmount={target}
                        currentAmount={current}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl flex-1 text-xs h-8"
                        >
                          Update Progress
                        </Button>
                      </UpdateProgressDialog>
                    )}
                    <SavingsGoalFormDialog
                      userId={userId}
                      defaultValues={defaultValues}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </SavingsGoalFormDialog>
                    <SavingsGoalDeleteButton userId={userId} goalId={goal.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
