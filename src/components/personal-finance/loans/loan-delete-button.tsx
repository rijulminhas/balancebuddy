"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteLoan } from "@/actions/personal-finance";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface LoanDeleteButtonProps {
  userId: string;
  loanId: string;
}

export function LoanDeleteButton({ userId, loanId }: LoanDeleteButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this loan record?")) return;

    setLoading(true);
    try {
      const result = await deleteLoan(userId, loanId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Loan deleted.");
    } catch {
      toast.error("Failed to delete. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive/60 hover:text-destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
