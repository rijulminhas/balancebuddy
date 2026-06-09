"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { settleShare } from "@/actions/expenses";
import { format } from "date-fns";
import { fmt } from "./utils";
import type { ExpenseDetail as ExpenseDetailData } from "./types";

export function ExpenseDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [expense, setExpense] = useState<ExpenseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    fetch(`/api/expenses/${id}`)
      .then((r) => r.json())
      .then((d) => { setExpense(d); setLoading(false); });
  }, [id]);

  async function handleSettle() {
    if (!session?.user?.id || !expense) return;
    setSettling(true);
    try {
      const result = await settleShare(session.user.id, expense.id);
      if (!result.success) { toast.error(result.error); return; }
      toast.success("Your share marked as paid!");
      const res = await fetch(`/api/expenses/${id}`);
      setExpense(await res.json());
    } catch {
      toast.error("Failed to settle share.");
    } finally {
      setSettling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!expense) return <p className="text-sm text-muted-foreground">Expense not found.</p>;

  const total = Number(expense.amount);
  const myParticipant = expense.participants.find((p) => p.userId === session?.user?.id);
  const myShare = myParticipant ? Number(myParticipant.shareAmount) : 0;
  const iAmPayer = expense.paidById === session?.user?.id;

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">{expense.title}</h1>
        <Badge variant={expense.isSettled ? "success" : "warning"} className="ml-auto">
          {expense.isSettled ? "Settled" : "Pending"}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total amount</span>
            <span className="font-semibold">₹{fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Paid by</span>
            <span>{expense.paidByName}{iAmPayer ? " (you)" : ""}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Split type</span>
            <span className="capitalize">{expense.splitType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{format(new Date(expense.date), "dd MMM yyyy")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Category</span>
            <span className="capitalize">{expense.category}</span>
          </div>
          {expense.description && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Note</span>
              <span className="text-right max-w-[60%]">{expense.description}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {expense.receiptUrls && expense.receiptUrls.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Receipt / Bill / Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {expense.receiptUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-28 w-28 overflow-hidden rounded-lg border hover:opacity-90 transition-opacity"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`receipt-${i + 1}`} className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Split breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {expense.participants.map((p) => {
            const share = Number(p.shareAmount);
            const isYou = p.userId === session?.user?.id;
            const isPayer = p.userId === expense.paidById;
            return (
              <div
                key={p.userId}
                className="flex items-center justify-between rounded-md px-3 py-2 text-sm bg-muted/40"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {p.name}
                    {isYou && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                  </span>
                  {isPayer && (
                    <Badge variant="secondary" className="text-xs py-0">paid</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {expense.splitType === "percentage" && p.sharePercentage && (
                    <span className="text-xs text-muted-foreground">
                      {Number(p.sharePercentage).toFixed(1)}%
                    </span>
                  )}
                  <span className="font-medium">₹{fmt(share)}</span>
                  <Badge variant={p.isPaid ? "success" : "warning"} className="text-xs py-0">
                    {p.isPaid ? "Paid" : "Owes"}
                  </Badge>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between border-t pt-2 text-sm font-semibold px-3">
            <span>Total</span>
            <span>₹{fmt(expense.participants.reduce((s, p) => s + Number(p.shareAmount), 0))}</span>
          </div>
        </CardContent>
      </Card>

      {myParticipant && !myParticipant.isPaid && !iAmPayer && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Your share</p>
              <p className="text-xl font-bold">₹{fmt(myShare)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                owed to {expense.paidByName}
              </p>
            </div>
            <Button onClick={handleSettle} disabled={settling}>
              {settling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Mark as paid
            </Button>
          </CardContent>
        </Card>
      )}

      {myParticipant?.isPaid && !iAmPayer && (
        <p className="text-sm text-center text-muted-foreground">
          ✓ You have paid your share of ₹{fmt(myShare)}
        </p>
      )}

      {iAmPayer && !expense.isSettled && (
        <p className="text-sm text-center text-muted-foreground">
          You paid this expense. Waiting for{" "}
          {expense.participants.filter((p) => !p.isPaid && p.userId !== session?.user?.id).length}{" "}
          member(s) to settle.
        </p>
      )}
    </div>
  );
}
