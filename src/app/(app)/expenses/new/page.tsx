"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Info, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createExpense } from "@/actions/expenses";

const CATEGORIES = [
  "groceries", "rent", "utilities", "internet",
  "repairs", "maintenance", "entertainment", "miscellaneous",
] as const;

const SPLIT_TYPES = [
  { value: "equal", label: "Equal" },
  { value: "percentage", label: "By percentage %" },
  { value: "amount", label: "By exact amount ₹" },
] as const;

const schema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(500).optional(),
  amount: z.coerce.number().positive("Must be positive"),
  category: z.enum(CATEGORIES),
  splitType: z.enum(["equal", "percentage", "amount"]),
  date: z.string(),
});

type FormValues = z.infer<typeof schema>;

interface GroupMember { userId: string; name: string; }

function fmt(n: number) {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function NewExpensePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const [receiptPreviews, setReceiptPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      title: "",
      description: "",
      amount: 0,
      category: "miscellaneous",
      splitType: "equal",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const amount = form.watch("amount") || 0;
  const splitType = form.watch("splitType");

  useEffect(() => {
    fetch("/api/groups/me").then((r) => r.json()).then((data) => {
      setGroupId(data.groupId);
      const mems: GroupMember[] = data.members ?? [];
      setMembers(mems);
      setSelectedMembers(mems.map((m) => m.userId));
    });
  }, []);

  useEffect(() => {
    if (splitType === "percentage") {
      const even = selectedMembers.length
        ? fmt(100 / selectedMembers.length).replace(/,/g, "")
        : "0";
      const next: Record<string, string> = {};
      selectedMembers.forEach((id) => { next[id] = even; });
      setCustomSplits(next);
    } else if (splitType === "amount") {
      const even = selectedMembers.length
        ? fmt(amount / selectedMembers.length).replace(/,/g, "")
        : "0";
      const next: Record<string, string> = {};
      selectedMembers.forEach((id) => { next[id] = even; });
      setCustomSplits(next);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splitType, selectedMembers.length]);

  function toggleMember(userId: string) {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  const setSplit = useCallback((userId: string, val: string) => {
    setCustomSplits((prev) => ({ ...prev, [userId]: val }));
  }, []);

  function handleReceiptChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (receiptFiles.length + files.length > 5) {
      toast.error("Maximum 5 images allowed.");
      return;
    }
    const valid = files.filter((f) => {
      if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name} exceeds 5 MB.`); return false; }
      return true;
    });
    setReceiptFiles((prev) => [...prev, ...valid]);
    valid.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setReceiptPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  }

  function removeReceipt(index: number) {
    setReceiptFiles((prev) => prev.filter((_, i) => i !== index));
    setReceiptPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function getShares(): Record<string, number> {
    const result: Record<string, number> = {};
    if (!selectedMembers.length) return result;
    if (splitType === "equal") {
      const share = Math.round((amount / selectedMembers.length) * 100) / 100;
      selectedMembers.forEach((id) => { result[id] = share; });
    } else if (splitType === "percentage") {
      selectedMembers.forEach((id) => {
        const pct = parseFloat(customSplits[id] ?? "0") || 0;
        result[id] = Math.round((amount * pct) / 100 * 100) / 100;
      });
    } else {
      selectedMembers.forEach((id) => {
        result[id] = parseFloat(customSplits[id] ?? "0") || 0;
      });
    }
    return result;
  }

  function getSplitError(): string | null {
    if (splitType === "equal" || !selectedMembers.length) return null;
    if (splitType === "percentage") {
      const total = selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id] ?? "0") || 0), 0);
      if (Math.abs(total - 100) > 0.01) return `Percentages must sum to 100% (currently ${fmt(total)}%)`;
    }
    if (splitType === "amount") {
      const total = selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id] ?? "0") || 0), 0);
      if (Math.abs(total - amount) > 0.01) return `Amounts must sum to ₹${fmt(amount)} (currently ₹${fmt(total)})`;
    }
    return null;
  }

  async function onSubmit(values: FormValues) {
    if (!session?.user?.id || !groupId) {
      toast.error("You must be in a group to add expenses.");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Select at least one participant.");
      return;
    }
    const splitError = getSplitError();
    if (splitError) { toast.error(splitError); return; }

    setIsLoading(true);
    try {
      const receiptUrls: string[] = [];
      for (const file of receiptFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) { toast.error(data.error ?? "Upload failed"); setIsLoading(false); return; }
        receiptUrls.push(data.url);
      }

      const parsedCustomSplits: Record<string, number> = {};
      if (values.splitType !== "equal") {
        selectedMembers.forEach((id) => {
          parsedCustomSplits[id] = parseFloat(customSplits[id] ?? "0") || 0;
        });
      }

      const result = await createExpense(session.user.id, {
        groupId,
        ...values,
        splitType: values.splitType as "equal" | "percentage" | "amount" | "custom",
        date: new Date(values.date).toISOString(),
        participantIds: selectedMembers,
        customSplits: values.splitType !== "equal" ? parsedCustomSplits : undefined,
        receiptUrls,
      });

      if (!result.success) { toast.error(result.error); return; }

      toast.success("Expense added!");
      router.push("/expenses");
      router.refresh();
    } catch {
      toast.error("Failed to add expense.");
    } finally {
      setIsLoading(false);
    }
  }

  const shares = getShares();
  const splitError = getSplitError();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Add expense</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Expense details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expense details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input placeholder="Groceries run" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date *</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="splitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Split type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPLIT_TYPES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional note..." className="resize-none" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Receipt images */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Receipt / Bill images
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(optional, max 5)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {receiptPreviews.map((src, i) => (
                    <div key={i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`receipt-${i}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeReceipt(i)}
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {receiptFiles.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px]">Add</span>
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleReceiptChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* Participants + Split */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Split between</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {members.length === 0 ? (
                <p className="text-xs text-muted-foreground">Loading members…</p>
              ) : (
                <>
                  {splitType !== "equal" && (
                    <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5 mb-1">
                      <span>Member</span>
                      <span>{splitType === "percentage" ? "Share %" : "Amount ₹"}</span>
                    </div>
                  )}

                  {members.map((m) => {
                    const checked = selectedMembers.includes(m.userId);
                    const isYou = m.userId === session?.user?.id;
                    return (
                      <div key={m.userId} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input accent-primary shrink-0"
                          checked={checked}
                          onChange={() => toggleMember(m.userId)}
                        />
                        <span className="text-sm flex-1 min-w-0 truncate">
                          {m.name}
                          {isYou && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}
                        </span>

                        {checked && splitType === "equal" && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            ₹{fmt(shares[m.userId] ?? 0)}
                          </span>
                        )}

                        {checked && splitType === "percentage" && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
                              type="number" min="0" max="100" step="0.01"
                              className="h-7 w-20 text-xs text-right"
                              value={customSplits[m.userId] ?? ""}
                              onChange={(e) => setSplit(m.userId, e.target.value)}
                            />
                            <span className="text-xs text-muted-foreground w-4">%</span>
                            <span className="text-xs text-muted-foreground w-20 text-right">
                              = ₹{fmt(shares[m.userId] ?? 0)}
                            </span>
                          </div>
                        )}

                        {checked && splitType === "amount" && (
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number" min="0" step="0.01"
                              className="h-7 w-24 text-xs text-right"
                              value={customSplits[m.userId] ?? ""}
                              onChange={(e) => setSplit(m.userId, e.target.value)}
                            />
                          </div>
                        )}

                        {!checked && splitType !== "equal" && (
                          <span className="text-xs text-muted-foreground shrink-0 w-28 text-right">—</span>
                        )}
                      </div>
                    );
                  })}

                  {splitType === "equal" && selectedMembers.length > 0 && amount > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      ₹{fmt(amount)} ÷ {selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""} = ₹{fmt(Math.round((amount / selectedMembers.length) * 100) / 100)} each
                    </div>
                  )}

                  {splitType !== "equal" && (
                    <div className={`mt-2 flex items-center gap-1.5 rounded-md px-3 py-2 text-xs ${splitError ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-muted-foreground"}`}>
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      {splitType === "percentage"
                        ? `Total: ${fmt(selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id] ?? "0") || 0), 0))}% ${splitError ? "— must be 100%" : "✓"}`
                        : `Total: ₹${fmt(selectedMembers.reduce((s, id) => s + (parseFloat(customSplits[id] ?? "0") || 0), 0))} ${splitError ? `— must be ₹${fmt(amount)}` : "✓"}`
                      }
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isLoading || !groupId || !!splitError}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add expense
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
