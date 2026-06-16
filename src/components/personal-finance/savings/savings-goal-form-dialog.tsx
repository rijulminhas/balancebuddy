"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
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
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  createSavingsGoal,
  updateSavingsGoal,
} from "@/actions/personal-finance";
import { fmt } from "@/components/personal-finance/utils";

const schema = z.object({
  goalName: z.string().min(1, "Goal name is required").max(255),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  currentAmount: z.coerce.number().min(0).optional(),
  targetDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

function getRemainingMonths(today: Date, targetDate: Date): number {
  if (targetDate.getTime() <= today.getTime()) return 0;
  const y = targetDate.getFullYear() - today.getFullYear();
  const m = targetDate.getMonth() - today.getMonth();
  const d = targetDate.getDate() - today.getDate();
  return Math.max(0, y * 12 + m + (d > 0 ? 1 : 0));
}

interface AffordabilityResult {
  requiredMonthly: number;
  remaining: number;
  months: number;
}

interface SavingsGoalFormDialogProps {
  children: React.ReactNode;
  userId: string;
  monthlyIncome: number;
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
  monthlyIncome,
  defaultValues,
}: SavingsGoalFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [showBlockingModal, setShowBlockingModal] = useState(false);
  const isEditing = !!defaultValues;

  const {
    register,
    handleSubmit,
    reset,
    control,
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

  const [watchedTarget, watchedCurrent, watchedDate] = useWatch({
    control,
    name: ["targetAmount", "currentAmount", "targetDate"],
  });

  const affordability = useMemo<AffordabilityResult | null>(() => {
    const target = Number(watchedTarget) || 0;
    const current = Number(watchedCurrent) || 0;
    const remaining = Math.max(0, target - current);

    if (!watchedDate || remaining <= 0) return null;

    const today = new Date();
    const td = new Date(watchedDate as string);
    if (isNaN(td.getTime())) return null;

    const months = getRemainingMonths(today, td);
    if (months <= 0) return null;

    return { requiredMonthly: remaining / months, remaining, months };
  }, [watchedTarget, watchedCurrent, watchedDate]);

  const isBlocking =
    !isEditing &&
    affordability !== null &&
    monthlyIncome > 0 &&
    affordability.requiredMonthly > monthlyIncome;

  const isWarning =
    !isEditing &&
    affordability !== null &&
    monthlyIncome > 0 &&
    affordability.requiredMonthly >= monthlyIncome * 0.8 &&
    affordability.requiredMonthly <= monthlyIncome;

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
    if (isBlocking) {
      setShowBlockingModal(true);
      return;
    }

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
    <>
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

            {/* Non-blocking warning: 80–100% of monthly income */}
            {isWarning && (
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-relaxed">
                  This goal may be difficult to achieve based on your current income.
                </p>
              </div>
            )}

            {/* Blocking inline indicator: > monthly income */}
            {isBlocking && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-destructive">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs leading-relaxed">
                  Required savings of ₹{fmt(affordability!.requiredMonthly)}/mo exceeds your monthly income of ₹{fmt(monthlyIncome)}. Adjust the target amount or target date.
                </p>
              </div>
            )}

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

      {/* Blocking Modal — rendered outside Dialog to avoid stacking conflicts */}
      <AlertDialog open={showBlockingModal} onOpenChange={setShowBlockingModal}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 mb-1">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-black">
              Goal Not Realistic
            </AlertDialogTitle>
            <AlertDialogDescription>
              Your required monthly savings amount is higher than your monthly
              income. Please reduce the target amount, extend the target date,
              or increase your income before creating this goal.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            {/* Highlighted warning text */}
            <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3">
              <p className="text-sm font-bold text-destructive leading-snug">
                Bhagwan se daro bhai 😅, itni c income me itni savings kaise ho
                payegi ?
              </p>
            </div>

            {/* Details section */}
            {affordability && (
              <div className="rounded-xl border border-border/60 overflow-hidden text-sm">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                  <span className="text-muted-foreground">Monthly Income</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ₹{fmt(monthlyIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                  <span className="text-muted-foreground">
                    Required Monthly Savings
                  </span>
                  <span className="font-bold text-destructive">
                    ₹{fmt(affordability.requiredMonthly)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-muted-foreground">Difference</span>
                  <span className="font-bold text-destructive">
                    ₹{fmt(affordability.requiredMonthly - monthlyIncome)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            {/* Cancel closes both modals */}
            <AlertDialogCancel
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            {/* Edit Goal closes only the blocking modal, keeping the form open */}
            <AlertDialogAction className="rounded-xl">
              Edit Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
