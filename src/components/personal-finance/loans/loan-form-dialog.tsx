"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createLoan, updateLoan } from "@/actions/personal-finance";
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
import { LOAN_TYPES } from "@/components/personal-finance/constants";

const schema = z.object({
  loanName: z.string().min(1, "Loan name is required").max(255),
  totalAmount: z.coerce.number().positive("Total amount must be positive"),
  outstandingAmount: z.coerce
    .number()
    .min(0, "Outstanding must be non-negative"),
  emiAmount: z.coerce.number().positive("EMI must be positive"),
  loanType: z.enum([
    "home_loan",
    "car_loan",
    "personal_loan",
    "education_loan",
    "credit_card_emi",
    "other",
  ]),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

interface LoanFormDialogProps {
  children: React.ReactNode;
  userId: string;
  defaultValues?: {
    id: string;
    loanName: string;
    totalAmount: number;
    outstandingAmount: number;
    emiAmount: number;
    loanType: string;
    startDate: string;
    endDate?: string | null;
    notes?: string | null;
  };
}

export function LoanFormDialog({
  children,
  userId,
  defaultValues,
}: LoanFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditing = !!defaultValues?.id;

  const form = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      loanName: defaultValues?.loanName ?? "",
      totalAmount: defaultValues?.totalAmount ?? 0,
      outstandingAmount: defaultValues?.outstandingAmount ?? 0,
      emiAmount: defaultValues?.emiAmount ?? 0,
      loanType:
        (defaultValues?.loanType as FormData["loanType"]) ?? "personal_loan",
      startDate: defaultValues?.startDate ?? "",
      endDate: defaultValues?.endDate ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const {
    formState: { isSubmitting },
  } = form;

  async function onSubmit(data: FormData) {
    const result = isEditing
      ? await updateLoan(userId, defaultValues!.id, data)
      : await createLoan(userId, data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Loan updated!" : "Loan added!");
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Loan" : "Add Loan"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-1"
          >
            <FormField
              control={form.control}
              name="loanName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Home Loan – SBI"
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
              name="loanType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Type</FormLabel>
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
                      {LOAN_TYPES.map((type) => (
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
              name="totalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Amount (₹)</FormLabel>
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
              name="outstandingAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outstanding Amount (₹)</FormLabel>
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
              name="emiAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EMI Amount (₹/month)</FormLabel>
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" className="rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                {isEditing ? "Save Changes" : "Add Loan"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
