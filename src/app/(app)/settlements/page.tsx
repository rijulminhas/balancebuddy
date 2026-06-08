import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupMembers, settlements, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { computeGroupBalances } from "@/actions/settlements";
import { SettleDialog } from "./settle-dialog";

export const metadata: Metadata = { title: "Settlements" };

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default async function SettlementsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) redirect("/groups");

  const { groupId } = membership;

  const [{ memberBalances, optimizedTransactions }, allMembers, recentSettlements] =
    await Promise.all([
      computeGroupBalances(groupId),

      db
        .select({ id: users.id, name: users.name })
        .from(users)
        .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
        .where(
          and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active"))
        ),

      db
        .select({
          id: settlements.id,
          fromUserId: settlements.fromUserId,
          toUserId: settlements.toUserId,
          amount: settlements.amount,
          status: settlements.status,
          note: settlements.note,
          settledAt: settlements.settledAt,
          createdAt: settlements.createdAt,
        })
        .from(settlements)
        .where(eq(settlements.groupId, groupId))
        .orderBy(desc(settlements.createdAt))
        .limit(30),
    ]);

  const nameMap = new Map(allMembers.map((m) => [m.id, m.name ?? "Unknown"]));
  const myBalance = memberBalances.find((b) => b.userId === session.user.id);
  const myNetBalance = myBalance?.netBalance ?? 0;

  const myTransactions = optimizedTransactions.filter(
    (t) =>
      t.fromUserId === session.user.id || t.toUserId === session.user.id
  );

  const otherTransactions = optimizedTransactions.filter(
    (t) =>
      t.fromUserId !== session.user.id && t.toUserId !== session.user.id
  );

  const membersForDialog = allMembers
    .filter((m) => m.id !== session.user.id)
    .map((m) => ({ id: m.id, name: m.name ?? "Unknown" }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settlements</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Smart debt optimization — minimize transactions
          </p>
        </div>
        <SettleDialog groupId={groupId} members={membersForDialog}>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Record Payment
          </Button>
        </SettleDialog>
      </div>

      {/* My balance card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className={
            myNetBalance > 0
              ? "border-green-500/30 bg-green-500/5"
              : myNetBalance < 0
              ? "border-destructive/30 bg-destructive/5"
              : "border-border/60"
          }
        >
          <CardContent className="flex items-center justify-between py-5 px-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {myNetBalance > 0
                  ? "You are owed"
                  : myNetBalance < 0
                  ? "You owe"
                  : "Your balance"}
              </p>
              <p
                className={`text-3xl font-black tracking-tight mt-1 ${
                  myNetBalance > 0
                    ? "text-green-600"
                    : myNetBalance < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {myNetBalance === 0 ? "₹0.00" : `₹${fmt(Math.abs(myNetBalance))}`}
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                myNetBalance > 0
                  ? "bg-green-500/10"
                  : myNetBalance < 0
                  ? "bg-destructive/10"
                  : "bg-muted"
              }`}
            >
              {myNetBalance > 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : myNetBalance < 0 ? (
                <TrendingDown className="h-6 w-6 text-destructive" />
              ) : (
                <Sparkles className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* All-settled banner */}
        {optimizedTransactions.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 py-5 px-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">All settled up!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No outstanding debts in your group.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Optimized suggestions — my transactions first */}
      {optimizedTransactions.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-bold">
                Suggested settlements
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              {optimizedTransactions.length} transaction
              {optimizedTransactions.length !== 1 ? "s" : ""} to clear all
              debts
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...myTransactions, ...otherTransactions].map((t, i) => {
              const isFromMe = t.fromUserId === session.user.id;
              const isToMe = t.toUserId === session.user.id;
              const highlight = isFromMe || isToMe;

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                    highlight ? "bg-primary/5 border border-primary/20" : "bg-muted/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-sm min-w-0">
                    <span
                      className={`font-semibold truncate ${
                        isFromMe ? "text-destructive" : ""
                      }`}
                    >
                      {isFromMe ? "You" : t.fromName}
                    </span>
                    <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span
                      className={`font-semibold truncate ${
                        isToMe ? "text-green-600" : ""
                      }`}
                    >
                      {isToMe ? "You" : t.toName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-sm">₹{fmt(t.amount)}</span>
                    {isFromMe && (
                      <SettleDialog
                        groupId={groupId}
                        members={membersForDialog}
                        defaultToUserId={t.toUserId}
                        defaultAmount={t.amount}
                      >
                        <Button size="sm" variant="outline" className="rounded-xl h-7 px-2.5 text-xs font-semibold">
                          Pay
                        </Button>
                      </SettleDialog>
                    )}
                    {isToMe && (
                      <Badge variant="secondary" className="text-xs">
                        Incoming
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Group balance summary */}
      {memberBalances.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Group balance summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Net Balance</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberBalances
                  .sort((a, b) => b.netBalance - a.netBalance)
                  .map((mb) => (
                    <TableRow key={mb.userId}>
                      <TableCell className="font-medium text-sm">
                        {mb.userId === session.user.id ? `${mb.name} (you)` : mb.name}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        <span
                          className={
                            mb.netBalance > 0
                              ? "text-green-600"
                              : mb.netBalance < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {mb.netBalance >= 0 ? "+" : ""}₹{fmt(mb.netBalance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            mb.netBalance > 0
                              ? "success"
                              : mb.netBalance < 0
                              ? "warning"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {mb.netBalance > 0
                            ? "Is owed"
                            : mb.netBalance < 0
                            ? "Owes"
                            : "Settled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Settlement history */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Payment history</CardTitle>
        </CardHeader>
        {recentSettlements.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ArrowLeftRight className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No payments recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Record a payment to track settlements.
              </p>
            </div>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSettlements.map((s) => {
                    const isFromMe = s.fromUserId === session.user.id;
                    const isToMe = s.toUserId === session.user.id;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm font-medium">
                          {isFromMe ? (
                            <span className="text-destructive font-semibold">You</span>
                          ) : (
                            nameMap.get(s.fromUserId) ?? "Unknown"
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {isToMe ? (
                            <span className="text-green-600 font-semibold">You</span>
                          ) : (
                            nameMap.get(s.toUserId) ?? "Unknown"
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold">
                          ₹{fmt(Number(s.amount))}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(
                            new Date(s.settledAt ?? s.createdAt),
                            "dd MMM yyyy"
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                          {s.note ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
