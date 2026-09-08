"use client";

import { useState } from "react";
import { toast } from "sonner";
import { deleteIncome } from "@/actions/personal-finance";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface IncomeDeleteButtonProps {
  userId: string;
  incomeId: string;
}

export function IncomeDeleteButton({ userId, incomeId }: IncomeDeleteButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm("Delete this income record?")) return;

    setLoading(true);
    try {
      const result = await deleteIncome(userId, incomeId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Income record deleted.");
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
