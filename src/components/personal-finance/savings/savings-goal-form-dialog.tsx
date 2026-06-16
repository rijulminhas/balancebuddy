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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createSavingsGoal,
  updateSavingsGoal,
} from "@/actions/personal-finance";

const schema = z.object({
  goalName: z.string().min(1, "Goal name is required").max(255),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  currentAmount: z.coerce.number().min(0).optional(),
  targetDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

interface SavingsGoalFormDialogProps {
  children: React.ReactNode;
  userId: string;
  defaultValues?: {
    id: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    targetDate?: string | null;
    notes?: string | null;
  };
}

export function SavingsGoalFormDialog({
  children,
  userId,
  defaultValues,
}: SavingsGoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!defaultValues;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      goalName: "",
      targetAmount: 0,
      currentAmount: 0,
      targetDate: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        reset({
          goalName: defaultValues.goalName,
          targetAmount: defaultValues.targetAmount,
          currentAmount: defaultValues.currentAmount,
          targetDate: defaultValues.targetDate ?? "",
          notes: defaultValues.notes ?? "",
        });
      } else {
        reset({
          goalName: "",
          targetAmount: undefined,
          currentAmount: undefined,
          targetDate: "",
          notes: "",
        });
      }
    }
  }, [open, defaultValues, reset]);

  async function onSubmit(data: FormData) {
    const input = {
      goalName: data.goalName,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      targetDate: data.targetDate || undefined,
      notes: data.notes || undefined,
    };

    const result = isEditing
      ? await updateSavingsGoal(userId, defaultValues.id, input)
      : await createSavingsGoal(userId, input);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }

    toast.success(isEditing ? "Goal updated!" : "Savings goal created!");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Savings Goal" : "New Savings Goal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Goal Name */}
          <div className="space-y-1.5">
            <Label htmlFor="sg-goalName" className="text-sm font-medium">
              Goal Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sg-goalName"
              {...register("goalName")}
              placeholder="e.g. Emergency Fund"
              className="rounded-xl"
            />
            {errors.goalName && (
              <p className="text-xs text-destructive">
                {errors.goalName.message}
              </p>
            )}
          </div>

          {/* Target Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="sg-targetAmount" className="text-sm font-medium">
              Target Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="sg-targetAmount"
                type="number"
                step="0.01"
                min="0.01"
                {...register("targetAmount")}
                placeholder="0.00"
                className="rounded-xl pl-7"
              />
            </div>
            {errors.targetAmount && (
              <p className="text-xs text-destructive">
                {errors.targetAmount.message}
              </p>
            )}
          </div>

          {/* Current Saved Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="sg-currentAmount" className="text-sm font-medium">
              Current Saved Amount
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                ₹
              </span>
              <Input
                id="sg-currentAmount"
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

          {/* Target Date */}
          <div className="space-y-1.5">
            <Label htmlFor="sg-targetDate" className="text-sm font-medium">
              Target Date
            </Label>
            <Input
              id="sg-targetDate"
              type="date"
              {...register("targetDate")}
              className="rounded-xl"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="sg-notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="sg-notes"
              {...register("notes")}
              placeholder="Any additional details…"
              className="rounded-xl resize-none"
              rows={2}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
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
              {isEditing ? "Save Changes" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
