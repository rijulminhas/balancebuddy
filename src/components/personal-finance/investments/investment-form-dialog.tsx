"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createInvestment, updateInvestment } from "@/actions/personal-finance";
import { INVESTMENT_TYPES } from "@/components/personal-finance/constants";

const schema = z.object({
  investmentName: z.string().min(1, "Name is required").max(255),
  amount: z.coerce.number().positive("Amount must be positive"),
  investmentType: z.enum([
    "sip",
    "mutual_fund",
    "stocks",
    "ppf",
    "fd",
    "crypto",
    "gold",
    "other",
  ]),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

interface InvestmentFormDialogProps {
  children: React.ReactNode;
  userId: string;
  defaultValues?: {
    id: string;
    investmentName: string;
    amount: number;
    investmentType: string;
    date: string; // YYYY-MM-DD
    notes?: string | null;
  };
}

export function InvestmentFormDialog({
  children,
  userId,
  defaultValues,
}: InvestmentFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!defaultValues;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      investmentName: defaultValues?.investmentName ?? "",
      amount: defaultValues?.amount ?? 0,
      investmentType:
        (defaultValues?.investmentType as FormData["investmentType"]) ?? "sip",
      date: defaultValues?.date ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const selectedType = watch("investmentType");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      reset({
        investmentName: defaultValues?.investmentName ?? "",
        amount: defaultValues?.amount ?? 0,
        investmentType:
          (defaultValues?.investmentType as FormData["investmentType"]) ?? "sip",
        date: defaultValues?.date ?? "",
        notes: defaultValues?.notes ?? "",
      });
    }
  }

  async function onSubmit(data: FormData) {
    const result = isEditing
      ? await updateInvestment(userId, defaultValues!.id, data)
      : await createInvestment(userId, data);

    if (!result.success) {
      toast.error(result.error ?? "Something went wrong");
      return;
    }

    toast.success(
      isEditing ? "Investment updated!" : "Investment recorded!"
    );
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Investment" : "Add Investment"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Investment Name */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-name" className="text-sm font-medium">
              Investment Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inv-name"
              {...register("investmentName")}
              placeholder="e.g. HDFC Midcap Fund"
              className="rounded-xl"
            />
            {errors.investmentName && (
              <p className="text-xs text-destructive">
                {errors.investmentName.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-amount" className="text-sm font-medium">
              Amount (₹) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inv-amount"
              type="number"
              step="0.01"
              min="0.01"
              {...register("amount")}
              placeholder="0.00"
              className="rounded-xl"
            />
            {errors.amount && (
              <p className="text-xs text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Investment Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedType}
              onValueChange={(v) =>
                setValue("investmentType", v as FormData["investmentType"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INVESTMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.investmentType && (
              <p className="text-xs text-destructive">
                {errors.investmentType.message}
              </p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-date" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="inv-date"
              type="date"
              {...register("date")}
              className="rounded-xl"
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="inv-notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="inv-notes"
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
              onClick={() => handleOpenChange(false)}
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
              {isEditing ? "Save Changes" : "Add Investment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
