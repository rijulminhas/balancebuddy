"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Check, Trash2, ShoppingBag, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toggleShoppingItemPurchased, deleteShoppingItem } from "@/actions/shopping";
import { ShoppingItemFormDialog } from "./shopping-item-form-dialog";
import type { ShoppingListItem } from "./types";

interface ShoppingListClientProps {
  items: ShoppingListItem[];
  groupId: string;
}

export function ShoppingListClient({ items, groupId }: ShoppingListClientProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingListItem | null>(null);

  const pending = items.filter((i) => !i.isPurchased);
  const purchased = items.filter((i) => i.isPurchased);

  function handleToggle(itemId: string) {
    startTransition(async () => {
      const result = await toggleShoppingItemPurchased(session!.user.id, itemId);
      if (!result.success) toast.error(result.error);
    });
  }

  function openEdit(item: ShoppingListItem) {
    setEditItem(item);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditItem(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    startTransition(async () => {
      const result = await deleteShoppingItem(session!.user.id, id);
      if (!result.success) toast.error(result.error);
      else toast.success("Item removed");
    });
  }

  if (items.length === 0) {
    return (
      <>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Shopping List</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your list is empty</p>
          </div>
          <Button
            size="sm"
            className="rounded-xl shrink-0"
            onClick={() => { setEditItem(null); setFormOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Shopping Item
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">Shopping list is empty</p>
            <p className="mb-6 text-xs text-muted-foreground max-w-xs">
              Add items manually or use Monthly Essentials to populate the list quickly.
            </p>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => { setEditItem(null); setFormOpen(true); }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Shopping Item
            </Button>
          </CardContent>
        </Card>

        <ShoppingItemFormDialog
          open={formOpen}
          onOpenChange={handleFormClose}
          groupId={groupId}
          editItem={null}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Shopping List</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pending.length} remaining · {purchased.length} purchased
          </p>
        </div>
        <Button
          size="lg"
          className="rounded-xl shrink-0 cursor-pointer"
          onClick={() => { setEditItem(null); setFormOpen(true); }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {pending.length > 0 && (
        <ItemSection
          title="To Buy"
          items={pending}
          onToggle={handleToggle}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          isPending={isPending}
        />
      )}

      {purchased.length > 0 && (
        <ItemSection
          title="Purchased"
          items={purchased}
          onToggle={handleToggle}
          onEdit={openEdit}
          onDelete={setDeleteTarget}
          isPending={isPending}
          muted
        />
      )}

      <ShoppingItemFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        groupId={groupId}
        editItem={editItem}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from shopping list?</AlertDialogTitle>
            <AlertDialogDescription>
              This item will be removed from the shopping list. You can always
              re-add it from Monthly Essentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/80 cursor-pointer"
              onClick={confirmDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Section component ──

interface ItemSectionProps {
  title: string;
  items: ShoppingListItem[];
  onToggle: (id: string) => void;
  onEdit: (item: ShoppingListItem) => void;
  onDelete: (id: string) => void;
  isPending: boolean;
  muted?: boolean;
}

function ItemSection({
  title,
  items,
  onToggle,
  onEdit,
  onDelete,
  isPending,
  muted,
}: ItemSectionProps) {
  return (
    <Card className={`border-border/60 ${muted ? "opacity-70" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title} · {items.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3"
          >
            <button
              onClick={() => onToggle(item.id)}
              disabled={isPending}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                item.isPurchased
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/40 hover:border-primary"
              }`}
            >
              {item.isPurchased && <Check className="h-3 w-3" />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p
                  className={`text-sm font-medium ${
                    item.isPurchased ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {item.name}
                </p>
                {item.quantity && (
                  <Badge variant="outline" className="text-xs py-0 h-5 shrink-0">
                    {item.quantity}
                    {item.unit ? ` ${item.unit}` : ""}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs py-0 h-5 shrink-0">
                  {item.category}
                </Badge>
              </div>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {item.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                disabled={isPending}
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                disabled={isPending}
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
