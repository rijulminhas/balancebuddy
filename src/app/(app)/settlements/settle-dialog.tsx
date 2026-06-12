"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordSettlement } from "@/actions/settlements";
import { useSession } from "next-auth/react";

interface Member {
  id: string;
  name: string;
}

interface SettleDialogProps {
  groupId: string;
  members: Member[];
  defaultToUserId?: string;
  defaultAmount?: number;
  children: React.ReactNode;
}

const schema = z.object({
  toUserId: z.string().min(1, "Select a person"),
  amount: z.number().positive("Enter a valid amount"),
  method: z.string().optional(),
  reference: z.string().max(255).optional(),
  note: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export function SettleDialog({
  groupId,
  members,
  defaultToUserId,
  defaultAmount,
  children,
}: SettleDialogProps) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      toUserId: defaultToUserId ?? "",
      amount: defaultAmount,
      method: "",
    },
  });

  const selectedToUserId = watch("toUserId");

  async function onSubmit(data: FormData) {
    if (!session?.user?.id) return;
    const result = await recordSettlement(session.user.id, {
      groupId,
      ...data,
    });
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Payment submitted! Waiting for the recipient to confirm.");
    reset();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          {/* To user */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Paid to</Label>
            <Select
              value={selectedToUserId}
              onValueChange={(v) => setValue("toUserId", v, { shouldValidate: true })}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select person" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.toUserId && (
              <p className="text-xs text-destructive">{errors.toUserId.message}</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Amount (₹)</Label>
            {defaultAmount != null ? (
              <div className="flex items-center h-9 px-3 rounded-xl border border-input bg-muted text-sm font-semibold text-foreground select-none">
                ₹{defaultAmount.toFixed(2)}
              </div>
            ) : (
              <Input
                {...register("amount", { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="rounded-xl"
              />
            )}
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Method */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Payment method</Label>
            <Select
              onValueChange={(v) => setValue("method", v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select method (optional)" />
              </SelectTrigger>
              <SelectContent>
                {["Cash", "UPI", "Bank Transfer", "Other"].map((m) => (
                  <SelectItem key={m} value={m.toLowerCase().replace(" ", "_")}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Reference / UTR (optional)</Label>
            <Input
              {...register("reference")}
              placeholder="e.g. UPI transaction ID"
              className="rounded-xl"
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Note (optional)</Label>
            <Textarea
              {...register("note")}
              placeholder="Add a note…"
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
