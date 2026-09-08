"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createShoppingItem, updateShoppingItem } from "@/actions/shopping";
import { ESSENTIAL_CATEGORIES, ESSENTIAL_UNITS } from "./constants";
import type { ShoppingListItem } from "./types";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  quantity: z.string().max(20).optional(),
  unit: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  notes: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface ShoppingItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  editItem?: ShoppingListItem | null;
}

export function ShoppingItemFormDialog({
  open,
  onOpenChange,
  groupId,
  editItem,
}: ShoppingItemFormDialogProps) {
  const { data: session } = useSession();
  const isEditing = !!editItem;

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
      name: "",
      quantity: "",
      unit: "",
      category: "Groceries",
      notes: "",
    },
  });

  const selectedCategory = watch("category");
  const selectedUnit = watch("unit");

  useEffect(() => {
    if (open) {
      if (editItem) {
        reset({
          name: editItem.name,
          quantity: editItem.quantity ?? "",
          unit: editItem.unit ?? "",
          category: editItem.category,
          notes: editItem.notes ?? "",
        });
      } else {
        reset({
          name: "",
          quantity: "",
          unit: "",
          category: "Groceries",
          notes: "",
        });
      }
    }
  }, [open, editItem, reset]);

  async function onSubmit(data: FormData) {
    if (!session?.user?.id) return;

    const result = isEditing
      ? await updateShoppingItem(session.user.id, editItem!.id, data)
      : await createShoppingItem(session.user.id, groupId, data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditing ? "Item updated!" : "Item added to shopping list!");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Item" : "Add to Shopping List"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="sl-name" className="text-sm font-medium">
              Item Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sl-name"
              {...register("name")}
              placeholder="e.g. Bread"
              className="rounded-xl"
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sl-quantity" className="text-sm font-medium">
                Quantity
              </Label>
              <Input
                id="sl-quantity"
                {...register("quantity")}
                placeholder="e.g. 2"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Unit</Label>
              <Select
                value={selectedUnit ?? ""}
                onValueChange={(v) => setValue("unit", v === "_none" ? "" : v)}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {ESSENTIAL_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(v) => setValue("category", v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESSENTIAL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sl-notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="sl-notes"
              {...register("notes")}
              placeholder="Any additional details…"
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => onOpenChange(false)}
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
              {isEditing ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
