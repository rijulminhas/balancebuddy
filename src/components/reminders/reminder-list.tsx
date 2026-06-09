"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Home,
  Zap,
  Droplets,
  Wifi,
  CreditCard,
  Bell,
  Repeat,
  Pencil,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
import { ReminderForm } from "./reminder-form";
import { FREQUENCY_LABELS } from "@/lib/reminders";
import type { Reminder } from "@/db/schema";

interface ReminderListProps {
  initialReminders: Reminder[];
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  rent: { icon: Home, color: "text-blue-500", label: "Rent" },
  emi: { icon: CreditCard, color: "text-purple-500", label: "EMI" },
  electricity: { icon: Zap, color: "text-yellow-500", label: "Electricity" },
  water: { icon: Droplets, color: "text-cyan-500", label: "Water" },
  internet: { icon: Wifi, color: "text-green-500", label: "Internet" },
  subscription: { icon: Repeat, color: "text-orange-500", label: "Subscription" },
  custom: { icon: Bell, color: "text-muted-foreground", label: "Custom" },
};

function formatNextNotify(date: Date | null | string | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.ceil((d.getTime() - now.getTime()) / msPerDay);

  if (diff < 0) return "Overdue";
  if (diff === 0) return "Today at " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Tomorrow";
  if (diff < 7) return `In ${diff} days`;
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

function formatScheduleLabel(reminder: Reminder): string {
  const { frequency, dayOfMonth, dayOfWeek, monthOfYear, specificDate } = reminder;
  switch (frequency) {
    case "monthly":
      return dayOfMonth ? `Every month on the ${ordinal(dayOfMonth)}` : "Monthly";
    case "weekly":
      return dayOfWeek !== null && dayOfWeek !== undefined
        ? `Every ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOfWeek]}`
        : "Weekly";
    case "yearly":
      return dayOfMonth && monthOfYear
        ? `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][monthOfYear - 1]} ${ordinal(dayOfMonth)} every year`
        : "Yearly";
    case "daily":
      return "Every day";
    case "one_time":
      return specificDate
        ? new Date(specificDate).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })
        : "One-time";
    default:
      return FREQUENCY_LABELS[frequency as keyof typeof FREQUENCY_LABELS] ?? frequency;
  }
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export function ReminderList({ initialReminders }: ReminderListProps) {
  const [items, setItems] = useState<Reminder[]>(initialReminders);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialReminders);
  }, [initialReminders]);

  async function handleToggle(id: string, current: boolean) {
    setToggling(id);
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (!res.ok) {
        toast.error("Failed to update reminder");
        return;
      }
      setItems((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isActive: !current } : r))
      );
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete reminder");
      return;
    }
    setItems((prev) => prev.filter((r) => r.id !== id));
    toast.success("Reminder deleted");
    setDeletingId(null);
  }

  function handleSaved() {
    // Re-fetch the full list after save
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((d) => setItems(d.reminders ?? []));
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-semibold text-muted-foreground">No reminders yet</p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Add one to get push notifications before bills are due.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((reminder) => {
          const cfg = TYPE_CONFIG[reminder.type] ?? TYPE_CONFIG.custom;
          const Icon = cfg.icon;
          const daysLabel =
            reminder.reminderDaysBefore === 0
              ? "Same day"
              : reminder.reminderDaysBefore === 1
                ? "1 day before (24 h)"
                : `${reminder.reminderDaysBefore} days before`;

          return (
            <li
              key={reminder.id}
              className="flex items-start gap-4 rounded-xl border bg-card p-4 transition-opacity"
              style={{ opacity: reminder.isActive ? 1 : 0.55 }}
            >
              {/* Icon */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold leading-tight">{reminder.title}</span>
                  {reminder.amount && (
                    <Badge variant="secondary" className="text-xs font-medium">
                      ₹{reminder.amount}
                    </Badge>
                  )}
                  {!reminder.isActive && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      Paused
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatScheduleLabel(reminder)}
                  {" · "}
                  Notify {daysLabel}
                </p>

                {reminder.isActive && reminder.nextNotifyAt && (
                  <p className="text-xs text-muted-foreground/70">
                    Next: {formatNextNotify(reminder.nextNotifyAt)}
                  </p>
                )}

                {reminder.description && (
                  <p className="mt-1 text-xs text-muted-foreground/60 line-clamp-1">
                    {reminder.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={reminder.isActive}
                  onCheckedChange={() => handleToggle(reminder.id, reminder.isActive)}
                  disabled={toggling === reminder.id}
                  aria-label={reminder.isActive ? "Pause reminder" : "Enable reminder"}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setEditingReminder(reminder);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeletingId(reminder.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Edit dialog */}
      <ReminderForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingReminder(null);
        }}
        onSaved={handleSaved}
        editing={editingReminder}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(v) => !v && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the reminder and stop all future notifications for it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
