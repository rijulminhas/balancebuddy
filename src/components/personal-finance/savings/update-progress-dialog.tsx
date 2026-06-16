"use client";

import { useState, useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateGoalProgress } from "@/actions/personal-finance";
import { fmt } from "@/components/personal-finance/utils";

const schema = z.object({
  currentAmount: z.coerce.number().min(0, "Amount must be 0 or more"),
});

type FormData = z.infer<typeof schema>;

interface UpdateProgressDialogProps {
  children: React.ReactNode;
  userId: string;
  goalId: string;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
}

export function UpdateProgressDialog({
  children,
  userId,
  goalId,
  goalName,
  targetAmount,
  currentAmount,
}: UpdateProgressDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { currentAmount },
  });

  useEffect(() => {
    if (open) {
      reset({ currentAmount });
    }
  }, [open, currentAmount, reset]);

  async function onSubmit(data: FormData) {
    const result = await updateGoalProgress(userId, goalId, data.currentAmount);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update progress.");
      return;
    }

    toast.success("Progress updated!");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Update Progress</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 pb-2">
          <p className="text-sm font-semibold truncate">{goalName}</p>
          <p className="text-xs text-muted-foreground">
            Target:{" "}
            <span className="font-medium text-foreground">
              ₹{fmt(targetAmount)}
            </span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="up-currentAmount" className="text-sm font-medium">
              Current Saved Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="up-currentAmount"
                type="number"
                step="0.01"
                min="0"
                {...register("currentAmount")}
                placeholder="0.00"
                className="rounded-xl pl-7"
              />
            </div>
            {errors.currentAmount && (
              <p className="text-xs text-destructive">
                {errors.currentAmount.message}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-xl flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
