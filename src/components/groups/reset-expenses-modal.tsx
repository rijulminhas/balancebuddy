"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { resetGroupExpenses } from "@/actions/expenses";

const DEFAULT_REASON = "Expenses are reset to 0 by all members decision";

interface ResetExpensesModalProps {
  groupId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetExpensesModal({
  groupId,
  userId,
  open,
  onOpenChange,
}: ResetExpensesModalProps) {
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await resetGroupExpenses(userId, groupId, reason);
      if (result.success) {
        toast.success("All group expenses have been reset to zero.");
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to reset expenses.");
      }
    });
  }

  function handleOpenChange(open: boolean) {
    if (!isPending) {
      if (!open) setReason(DEFAULT_REASON);
      onOpenChange(open);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Reset all group expenses
          </DialogTitle>
          <DialogDescription>
            This will mark every expense and settlement in the group as settled,
            bringing all balances to zero. This action cannot be undone.
            A push notification with your reason will be sent to all members.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reset-reason" className="text-sm font-medium">
            Reason
          </Label>
          <Textarea
            id="reset-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={DEFAULT_REASON}
            className="resize-none text-sm"
            disabled={isPending}
          />
          <p className="text-right text-xs text-muted-foreground">
            {reason.length}/500
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || reason.trim().length === 0}
          >
            {isPending ? "Resetting…" : "Reset expenses"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
