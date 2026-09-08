import { getSession } from "@/lib/session";
import { db } from "@/db";
import { groupMembers, settlements, users } from "@/db/schema";
import { eq, and, desc, count, gte, lte } from "drizzle-orm";
import { PaymentHistoryFilter } from "./payment-history-filter";
import { redirect } from "next/navigation";
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
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { computeGroupBalances, getAwaitingConfirmations } from "@/actions/settlements";
import { SettleDialog } from "./settle-dialog";
import { PaymentConfirmationActions } from "./payment-confirmation-actions";
import { fmt } from "./utils";
import { PaginationBar } from "@/components/ui/pagination-bar";

const HISTORY_PAGE_SIZE = 20;

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "success" | "warning" | "secondary" | "destructive" | "outline" }
> = {
  completed: { label: "Settled", variant: "success" },
  awaiting_confirmation: { label: "Awaiting Confirmation", variant: "warning" },
  pending: { label: "Pending", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export async function SettlementsList({
  historyPage = 1,
  historyStatus = "all",
  historyMonth = "all",
}: {
  historyPage?: number;
  historyStatus?: string;
  historyMonth?: string;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, session.user.id), eq(groupMembers.status, "active")))
    .orderBy(desc(groupMembers.joinedAt))
    .limit(1);

  if (!membership) redirect("/groups");

  const { groupId } = membership;
  const historyOffset = (historyPage - 1) * HISTORY_PAGE_SIZE;

  const statusCondition =
    historyStatus === "pending"
      ? eq(settlements.status, "pending")
      : historyStatus === "completed"
      ? eq(settlements.status, "completed")
      : historyStatus === "rejected"
      ? eq(settlements.status, "rejected")
      : undefined;

  const monthCondition = (() => {
    if (!historyMonth || historyMonth === "all") return undefined;
    const [yearStr, monthStr] = historyMonth.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!year || !month) return undefined;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    return and(gte(settlements.createdAt, start), lte(settlements.createdAt, end));
  })();

  const historyWhere = and(
    eq(settlements.groupId, groupId),
    statusCondition,
    monthCondition,
  );

  const [
    { memberBalances, optimizedTransactions },
    allMembers,
    recentSettlements,
    [{ historyTotal }],
    awaitingConfirmations,
  ] = await Promise.all([
    computeGroupBalances(groupId),

    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active"))),

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
      .where(historyWhere)
      .orderBy(desc(settlements.createdAt))
      .limit(HISTORY_PAGE_SIZE)
      .offset(historyOffset),

    db
      .select({ historyTotal: count() })
      .from(settlements)
      .where(historyWhere),

    getAwaitingConfirmations(groupId, session.user.id),
  ]);

  const historyTotalPages = Math.ceil(historyTotal / HISTORY_PAGE_SIZE);

  const nameMap = new Map(allMembers.map((m) => [m.id, m.name ?? "Unknown"]));
  const myBalance = memberBalances.find((b) => b.userId === session.user.id);
  const myNetBalance = myBalance?.netBalance ?? 0;

  const myTransactions = optimizedTransactions.filter(
    (t) => t.fromUserId === session.user.id || t.toUserId === session.user.id
  );
  const otherTransactions = optimizedTransactions.filter(
    (t) => t.fromUserId !== session.user.id && t.toUserId !== session.user.id
  );

  const membersForDialog = allMembers
    .filter((m) => m.id !== session.user.id)
    .map((m) => ({ id: m.id, name: m.name ?? "Unknown" }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settlements</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Smart debt optimization — minimize transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {awaitingConfirmations.length > 0 && (
            <Badge className="rounded-xl px-3 py-1 text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Awaiting Confirmation ({awaitingConfirmations.length})
            </Badge>
          )}
          {/* <SettleDialog groupId={groupId} members={membersForDialog}>
            <Button size="sm" className="rounded-xl gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Record Payment
            </Button>
          </SettleDialog> */}
        </div>
      </div>

      {/* ── Awaiting Your Confirmation ─────────────────────────────────── */}
      {awaitingConfirmations.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/15">
                <AlertCircle className="h-4 w-4 text-amber-500" />
              </div>
              <CardTitle className="text-base font-bold text-amber-700 dark:text-amber-400">
                Awaiting Your Confirmation
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Review each payment claim and confirm or reject receipt.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {awaitingConfirmations.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-amber-500/20 bg-background px-4 py-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {item.fromUserName}{" "}
                      <span className="font-normal text-muted-foreground">claims to have paid</span>{" "}
                      <span className="text-green-600">₹{fmt(item.amount)}</span>
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                      {item.paymentMethod && (
                        <span>
                          Method:{" "}
                          <span className="font-medium text-foreground capitalize">
                            {item.paymentMethod.replace("_", " ")}
                          </span>
                        </span>
                      )}
                      {item.paymentReference && (
                        <span>
                          Ref:{" "}
                          <span className="font-medium text-foreground font-mono">
                            {item.paymentReference}
                          </span>
                        </span>
                      )}
                      {item.note && (
                        <span>
                          Note: <span className="font-medium text-foreground">{item.note}</span>
                        </span>
                      )}
                      {item.submittedAt && (
                        <span>
                          Submitted:{" "}
                          <span className="font-medium text-foreground">
                            {format(new Date(item.submittedAt), "dd MMM yyyy, hh:mm a")}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <PaymentConfirmationActions
                    settlementId={item.id}
                    payerName={item.fromUserName}
                    amount={item.amount}
                    userId={session.user.id}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Balance card ───────────────────────────────────────────────── */}
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
                {myNetBalance > 0 ? "You are owed" : myNetBalance < 0 ? "You owe" : "Your balance"}
              </p>
              <p
                className={`text-3xl font-black tracking-tight mt-1 ${
                  myNetBalance > 0 ? "text-green-600" : myNetBalance < 0 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {myNetBalance === 0 ? "₹0.00" : `₹${fmt(Math.abs(myNetBalance))}`}
              </p>
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                myNetBalance > 0 ? "bg-green-500/10" : myNetBalance < 0 ? "bg-destructive/10" : "bg-muted"
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

        {optimizedTransactions.length === 0 && (
          <Card className="border-border/60">
            <CardContent className="flex items-center gap-3 py-5 px-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm">All settled up!</p>
                <p className="text-xs text-muted-foreground mt-0.5">No outstanding debts in your group.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Suggested settlements ─────────────────────────────────────── */}
      {optimizedTransactions.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-bold">Suggested settlements</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              {optimizedTransactions.length} transaction{optimizedTransactions.length !== 1 ? "s" : ""} to clear all debts
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
                    <span className={`font-semibold truncate ${isFromMe ? "text-destructive" : ""}`}>
                      {isFromMe ? "You" : t.fromName}
                    </span>
                    <ArrowLeftRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className={`font-semibold truncate ${isToMe ? "text-green-600" : ""}`}>
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
                          Record Payment
                        </Button>
                      </SettleDialog>
                    )}
                    {isToMe && (
                      <Badge variant="secondary" className="text-xs">Incoming</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* ── Group balance summary ─────────────────────────────────────── */}
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
                            mb.netBalance > 0 ? "text-green-600"
                            : mb.netBalance < 0 ? "text-destructive"
                            : "text-muted-foreground"
                          }
                        >
                          {mb.netBalance >= 0 ? "+" : ""}₹{fmt(mb.netBalance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={mb.netBalance > 0 ? "success" : mb.netBalance < 0 ? "warning" : "secondary"}
                          className="text-xs"
                        >
                          {mb.netBalance > 0 ? "Is owed" : mb.netBalance < 0 ? "Owes" : "Settled"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Payment history ───────────────────────────────────────────── */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">Payment history</CardTitle>
              {historyTotal > 0 && (
                <span className="text-xs text-muted-foreground">{historyTotal} total</span>
              )}
            </div>
            <PaymentHistoryFilter
              currentStatus={historyStatus}
              currentMonth={historyMonth}
            />
          </div>
        </CardHeader>
        {historyTotal === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ArrowLeftRight className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">No payments recorded yet</p>
              <p className="text-xs text-muted-foreground mt-1">Record a payment to track settlements.</p>
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
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSettlements.map((s) => {
                    const isFromMe = s.fromUserId === session.user.id;
                    const isToMe = s.toUserId === session.user.id;
                    const statusCfg = STATUS_BADGE[s.status] ?? STATUS_BADGE.pending;
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
                        <TableCell>
                          <Badge variant={statusCfg.variant} className="text-xs whitespace-nowrap">
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(s.settledAt ?? s.createdAt), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-30 truncate">
                          {s.note ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="px-6 pb-4">
              <PaginationBar
                page={historyPage}
                totalPages={historyTotalPages}
                extraParams={{
                  ...(historyStatus !== "all" && { historyStatus }),
                  ...(historyMonth !== "all" && { historyMonth }),
                }}
              />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
