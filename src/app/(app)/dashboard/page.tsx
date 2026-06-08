import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupMembers, groups, expenses, expenseParticipants, chores, settlements } from "@/db/schema";
import { eq, and, count, sum } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  Receipt,
  ArrowLeftRight,
  CheckSquare,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

async function getDashboardData(userId: string) {
  const [membership] = await db
    .select({ groupId: groupMembers.groupId, role: groupMembers.role })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .limit(1);

  if (!membership) return null;

  const { groupId } = membership;

  const [[groupInfo], [memberCount], [expenseStats], pendingChores, pendingSettlements, myOwed] =
    await Promise.all([
      db.select({ name: groups.name }).from(groups).where(eq(groups.id, groupId)).limit(1),

      db.select({ count: count() }).from(groupMembers)
        .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active"))),

      db.select({ total: sum(expenses.amount), expenseCount: count() })
        .from(expenses)
        .where(and(eq(expenses.groupId, groupId), eq(expenses.isSettled, false))),

      db.select({ id: chores.id, title: chores.title, assignedToId: chores.assignedToId })
        .from(chores)
        .where(and(eq(chores.groupId, groupId), eq(chores.status, "pending")))
        .limit(5),

      db.select({ id: settlements.id, amount: settlements.amount, fromUserId: settlements.fromUserId })
        .from(settlements)
        .where(and(eq(settlements.groupId, groupId), eq(settlements.status, "pending"), eq(settlements.toUserId, userId)))
        .limit(5),

      db.select({ shareAmount: expenseParticipants.shareAmount })
        .from(expenseParticipants)
        .innerJoin(expenses, eq(expenseParticipants.expenseId, expenses.id))
        .where(and(
          eq(expenseParticipants.userId, userId),
          eq(expenseParticipants.isPaid, false),
          eq(expenses.groupId, groupId),
        )),
    ]);

  const iOwe = myOwed.reduce((s, r) => s + Number(r.shareAmount), 0);

  return {
    group: groupInfo,
    groupId,
    role: membership.role,
    memberCount: memberCount.count,
    totalUnsettledExpenses: expenseStats.total ?? "0",
    expenseCount: expenseStats.expenseCount,
    pendingChores,
    pendingSettlements,
    iOwe,
  };
}

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const data = await getDashboardData(session.user.id);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
          <Home className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mb-3 text-3xl font-black tracking-tight">No group yet</h2>
        <p className="mb-8 text-base text-muted-foreground max-w-xs">
          Create a new group or join an existing one with an invite code.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg" className="rounded-xl font-bold text-base px-6">
            <Link href="/groups/create">
              <Plus className="mr-2 h-5 w-5" />
              Create Group
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="rounded-xl font-bold text-base px-6">
            <Link href="/groups/join">Join Group</Link>
          </Button>
        </div>
      </div>
    );
  }

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {data.group?.name ?? "Your Group"}
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Hey, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            Here&apos;s what&apos;s happening in your group today.
          </p>
        </div>
        <Button asChild size="lg" className="rounded-xl font-bold hidden sm:flex">
          <Link href="/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Groupmates",
            value: data.memberCount,
            suffix: "",
            icon: Users,
            href: "/groups",
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Pending Expenses",
            value: data.expenseCount,
            suffix: "",
            icon: Receipt,
            href: "/expenses",
            color: "text-orange-500",
            bg: "bg-orange-500/10",
          },
          {
            label: "Open Chores",
            value: data.pendingChores.length,
            suffix: "",
            icon: CheckSquare,
            href: "/chores",
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Owed to You",
            value: data.pendingSettlements.length,
            suffix: "",
            icon: ArrowLeftRight,
            href: "/settlements",
            color: "text-violet-500",
            bg: "bg-violet-500/10",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-border/60">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.bg}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 mt-1" />
                  </div>
                  <p className="text-3xl font-black tracking-tight">{card.value}</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{card.label}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Balance strip */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center justify-between py-5 px-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-destructive/70">You Owe</p>
              <p className="text-3xl font-black tracking-tight text-destructive mt-1">
                ₹{fmt(data.iOwe)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10">
              <TrendingUp className="h-6 w-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between py-5 px-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary/70">Total Unsettled</p>
              <p className="text-3xl font-black tracking-tight text-primary mt-1">
                ₹{fmt(Number(data.totalUnsettledExpenses))}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl font-bold border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground">
              <Link href="/settlements">Settle Up</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Pending chores */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckSquare className="h-4 w-4 text-emerald-500" />
              </div>
              <CardTitle className="text-base font-bold">Pending Chores</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl font-semibold text-xs">
              <Link href="/chores">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.pendingChores.length === 0 ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                No pending chores — great job!
              </div>
            ) : (
              <ul className="space-y-2">
                {data.pendingChores.map((chore) => (
                  <li key={chore.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                    <span className="text-sm font-medium">{chore.title}</span>
                    {chore.assignedToId === session.user.id && (
                      <Badge variant="warning" className="text-xs font-bold">Yours</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Owed to you */}
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-violet-500/10">
                <ArrowLeftRight className="h-4 w-4 text-violet-500" />
              </div>
              <CardTitle className="text-base font-bold">Owed to You</CardTitle>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl font-semibold text-xs">
              <Link href="/settlements">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.pendingSettlements.length === 0 ? (
              <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-violet-500" />
                All settled up!
              </div>
            ) : (
              <ul className="space-y-2">
                {data.pendingSettlements.map((s) => (
                  <li key={s.id} className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
                    <span className="text-sm font-medium text-muted-foreground truncate">{s.fromUserId}</span>
                    <Badge variant="success" className="font-bold">
                      ₹{Number(s.amount).toLocaleString("en-IN")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
