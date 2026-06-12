"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { confirmPayment, rejectPayment } from "@/actions/settlements";

interface PaymentConfirmationActionsProps {
  settlementId: string;
  payerName: string;
  amount: number;
  userId: string;
}

export function PaymentConfirmationActions({
  settlementId,
  payerName,
  amount,
  userId,
}: PaymentConfirmationActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"confirm" | "reject" | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const formattedAmount = amount.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  function handleConfirm() {
    setPendingAction("confirm");
    startTransition(async () => {
      const result = await confirmPayment(userId, settlementId);
      setPendingAction(null);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success(`Payment of ₹${formattedAmount} confirmed!`);
      }
    });
  }

  function handleReject() {
    setPendingAction("reject");
    startTransition(async () => {
      const result = await rejectPayment(
        userId,
        settlementId,
        rejectionReason.trim() || undefined
      );
      setPendingAction(null);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Payment rejected. The payer has been notified.");
        setRejectOpen(false);
        setRejectionReason("");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        size="sm"
        className="rounded-xl h-8 px-3 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white cursor-pointer"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending && pendingAction === "confirm" ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
        )}
        Confirm
      </Button>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl h-8 px-3 text-xs font-semibold border-destructive/40 text-white bg-destructive/90 hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
            disabled={isPending}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              You are about to reject{" "}
              <span className="font-semibold text-foreground">{payerName}</span>
              &apos;s payment of{" "}
              <span className="font-semibold text-foreground">₹{formattedAmount}</span>.
              They will be notified and can resubmit.
            </p>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Reason (optional)</Label>
              <Textarea
                placeholder="e.g. I didn't receive this payment..."
                className="rounded-xl resize-none text-sm"
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setRejectOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={handleReject}
              disabled={isPending}
            >
              {isPending && pendingAction === "reject" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
