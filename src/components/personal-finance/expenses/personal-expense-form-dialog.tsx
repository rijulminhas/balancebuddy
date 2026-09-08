"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  createPersonalExpense,
  updatePersonalExpense,
} from "@/actions/personal-finance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { PERSONAL_EXPENSE_CATEGORIES } from "@/components/personal-finance/constants";

// ─── Schema ──────────────────────────────────────────────────────────────────

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.enum([
    "food",
    "travel",
    "fuel",
    "shopping",
    "entertainment",
    "bills",
    "healthcare",
    "education",
    "family",
    "other",
  ]),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PersonalExpenseFormDialogProps {
  children: React.ReactNode;
  userId: string;
  defaultValues?: {
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string; // YYYY-MM-DD
    notes?: string | null;
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonalExpenseFormDialog({
  children,
  userId,
  defaultValues,
}: PersonalExpenseFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEditing = !!defaultValues;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: defaultValues?.title ?? "",
      amount: defaultValues?.amount ?? (0 as number),
      category:
        (defaultValues?.category as FormValues["category"]) ?? "other",
      date: defaultValues?.date ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const result = isEditing
        ? await updatePersonalExpense(userId, defaultValues.id, {
            ...values,
            notes: values.notes ?? undefined,
          })
        : await createPersonalExpense(userId, {
            ...values,
            notes: values.notes ?? undefined,
          });

      if (!result.success) {
        toast.error(result.error ?? "Something went wrong");
        return;
      }

      toast.success(
        isEditing
          ? "Expense updated successfully"
          : "Expense added successfully"
      );
      setOpen(false);
      form.reset();
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({
        title: defaultValues?.title ?? "",
        amount: defaultValues?.amount ?? 0,
        category:
          (defaultValues?.category as FormValues["category"]) ?? "other",
        date: defaultValues?.date ?? "",
        notes: defaultValues?.notes ?? "",
      });
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lunch at cafe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PERSONAL_EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Notes{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any additional details…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Save Changes" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
