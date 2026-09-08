"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  Plus,
  ShoppingCart,
  MoreHorizontal,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  PackageOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { format } from "date-fns";
import { EssentialFormDialog } from "./essential-form-dialog";
import {
  deleteEssential,
  archiveEssential,
  addEssentialsToShoppingList,
} from "@/actions/shopping";
import type { EssentialItem } from "./types";

interface EssentialsClientProps {
  items: EssentialItem[];
  groupId: string;
  showArchived?: boolean;
}

export function EssentialsClient({
  items,
  groupId,
  showArchived = false,
}: EssentialsClientProps) {
  const { data: session } = useSession();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<EssentialItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = items.filter((i) => !i.isArchived);
  const archived = items.filter((i) => i.isArchived);
  const displayed = showArchived ? archived : active;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === displayed.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(displayed.map((i) => i.id)));
    }
  }

  function openEdit(item: EssentialItem) {
    setEditItem(item);
    setFormOpen(true);
  }

  function handleFormClose(open: boolean) {
    setFormOpen(open);
    if (!open) setEditItem(null);
  }

  function handleAddSelected() {
    if (selected.size === 0) return;
    startTransition(async () => {
      const result = await addEssentialsToShoppingList(
        session!.user.id,
        groupId,
        Array.from(selected)
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const { count, skipped } = result.data!;
      toast.success(
        skipped > 0
          ? `${count} item(s) added · ${skipped} already on the list`
          : `${count} item(s) added to Shopping List`
      );
      setSelected(new Set());
    });
  }

  function handleAddAll() {
    if (active.length === 0) return;
    startTransition(async () => {
      const result = await addEssentialsToShoppingList(
        session!.user.id,
        groupId,
        active.map((i) => i.id)
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const { count, skipped } = result.data!;
      toast.success(
        skipped > 0
          ? `${count} item(s) added · ${skipped} already on the list`
          : `${count} item(s) added to Shopping List`
      );
      setSelected(new Set());
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteEssential(session!.user.id, id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Item deleted");
      setDeleteTarget(null);
    });
  }

  function handleArchive(id: string, archive: boolean) {
    startTransition(async () => {
      const result = await archiveEssential(session!.user.id, id, archive);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(archive ? "Item archived" : "Item restored");
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Monthly Essentials
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {active.length} active · {archived.length} archived
            </p>
          </div>
          <Button
            size="lg"
            className="rounded-xl shrink-0 cursor-pointer"
            onClick={() => {
              setEditItem(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item to Essentials
          </Button>
        </div>

        {/* Bulk action bar */}
        {!showArchived && active.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={
                  selected.size > 0 && selected.size === displayed.length
                }
                ref={(el) => {
                  if (el)
                    el.indeterminate =
                      selected.size > 0 &&
                      selected.size < displayed.length;
                }}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded accent-primary cursor-pointer"
              />
              <span className="text-sm font-medium">
                {selected.size > 0
                  ? `${selected.size} selected`
                  : "Select all"}
              </span>
            </label>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                disabled={selected.size === 0 || isPending}
                onClick={handleAddSelected}
              >
                <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                Add Selected
              </Button>
              <Button
                size="sm"
                className="rounded-xl"
                disabled={active.length === 0 || isPending}
                onClick={handleAddAll}
              >
                <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                Add All to List
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {displayed.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">
                {showArchived ? "No archived items" : "No essentials yet"}
              </p>
              <p className="mb-6 text-xs text-muted-foreground max-w-xs">
                {showArchived
                  ? "Archived items will appear here."
                  : "Add commonly purchased items so you can quickly build your monthly shopping list."}
              </p>
              {!showArchived && (
                <Button
                  size="sm"
                  className="rounded-xl cursor-pointer"
                  onClick={() => {
                    setEditItem(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Items grouped by category */}
        {displayed.length > 0 && (
          <ItemsByCategory
            items={displayed}
            selected={selected}
            onToggle={toggleSelect}
            onEdit={openEdit}
            onDelete={(id) => setDeleteTarget(id)}
            onArchive={handleArchive}
            showArchived={showArchived}
            isPending={isPending}
          />
        )}

        {/* Archived toggle hint */}
        {!showArchived && archived.length > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            {archived.length} archived item{archived.length !== 1 ? "s" : ""}{" "}
            hidden — use the toggle above to view them.
          </p>
        )}
      </div>

      {/* Add/Edit dialog */}
      <EssentialFormDialog
        open={formOpen}
        onOpenChange={handleFormClose}
        groupId={groupId}
        editItem={editItem}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete essential item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the item from Monthly Essentials.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Items grouped by category ──

interface ItemsByCategoryProps {
  items: EssentialItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (item: EssentialItem) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  showArchived: boolean;
  isPending: boolean;
}

function ItemsByCategory({
  items,
  selected,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  showArchived,
  isPending,
}: ItemsByCategoryProps) {
  const grouped = items.reduce<Record<string, EssentialItem[]>>((acc, item) => {
    const key = item.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <Card key={cat} className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {cat} · {grouped[cat].length}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {grouped[cat].map((item) => (
              <EssentialRow
                key={item.id}
                item={item}
                isSelected={selected.has(item.id)}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
                showArchived={showArchived}
                isPending={isPending}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Single item row ──

interface EssentialRowProps {
  item: EssentialItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
  onEdit: (item: EssentialItem) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string, archive: boolean) => void;
  showArchived: boolean;
  isPending: boolean;
}

function EssentialRow({
  item,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  onArchive,
  showArchived,
  isPending,
}: EssentialRowProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
        isSelected
          ? "bg-primary/8 ring-1 ring-primary/20"
          : "bg-muted/40 hover:bg-muted/60"
      }`}
    >
      {/* Checkbox — only show for active items */}
      {!showArchived && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(item.id)}
          className="h-4 w-4 rounded accent-primary cursor-pointer shrink-0"
        />
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium">{item.name}</p>
          {item.quantity && (
            <Badge variant="outline" className="text-xs py-0 h-5 shrink-0">
              {item.quantity}
              {item.unit ? ` ${item.unit}` : ""}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Added by {item.createdByName}
          </p>
          {item.addedCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Added {item.addedCount}× to list
            </p>
          )}
          {item.lastAddedToShoppingAt && (
            <p className="text-xs text-muted-foreground">
              Last:{" "}
              {format(new Date(item.lastAddedToShoppingAt), "dd MMM yyyy")}
            </p>
          )}
          {item.notes && (
            <p className="text-xs text-muted-foreground italic truncate max-w-xs">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg shrink-0"
            disabled={isPending}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!showArchived && (
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => onArchive(item.id, !item.isArchived)}
          >
            {item.isArchived ? (
              <>
                <ArchiveRestore className="mr-2 h-3.5 w-3.5" />
                Restore
              </>
            ) : (
              <>
                <Archive className="mr-2 h-3.5 w-3.5" />
                Archive
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
