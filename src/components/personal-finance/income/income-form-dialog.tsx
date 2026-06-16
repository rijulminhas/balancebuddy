"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createIncome, updateIncome } from "@/actions/personal-finance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { INCOME_TYPES } from "@/components/personal-finance/constants";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  amount: z.coerce.number().positive("Amount must be positive"),
  incomeType: z.enum([
    "salary",
    "freelancing",
    "business",
    "rental_income",
    "bonus",
    "other",
  ]),
  date: z.string().min(1, "Date is required"),
  notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

interface IncomeFormDialogProps {
  children: React.ReactNode;
  userId: string;
  defaultValues?: {
    id: string;
    title: string;
    amount: number;
    incomeType: string;
    date: string;
    notes?: string | null;
  };
}

export function IncomeFormDialog({
  children,
  userId,
  defaultValues,
}: IncomeFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!defaultValues?.id;

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      title: defaultValues?.title ?? "",
      amount: defaultValues?.amount ?? 0,
      incomeType: (defaultValues?.incomeType as FormData["incomeType"]) ?? "salary",
      date: defaultValues?.date ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const { formState: { isSubmitting } } = form;

  async function onSubmit(data: FormData) {
    const result = isEditing
      ? await updateIncome(userId, defaultValues!.id, {
          ...data,
          amount: data.amount,
        })
      : await createIncome(userId, {
          ...data,
          amount: data.amount,
        });

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Income updated!" : "Income added!");
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Income" : "Add Income"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Monthly Salary"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                        ₹
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className="rounded-xl pl-7"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="incomeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Income Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INCOME_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any additional details…"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl flex-1"
                onClick={() => setOpen(false)}
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
                {isEditing ? "Save Changes" : "Add Income"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
