import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGroupActivity } from "@/actions/activity";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Receipt,
  ArrowLeftRight,
  CheckSquare,
  Users,
  Bell,
  ShieldCheck,
  Trash2,
  PenLine,
  Plus,
  Activity,
  LogIn,
  LogOut,
  AlarmClock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Human-readable config per action ────────────────────────────────────────

type ActionConfig = {
  label: (actor: string, after: Record<string, unknown> | null) => string;
  icon: React.ElementType;
  iconClass: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  dot: string;
};

const ACTION_MAP: Record<string, ActionConfig> = {
  "expense.created": {
    label: (a, after) =>
      `${a} added expense "${after?.title ?? "Untitled"}" — ₹${Number(after?.amount ?? 0).toLocaleString("en-IN")}`,
    icon: Receipt,
    iconClass: "text-orange-500",
    badgeVariant: "warning",
    dot: "bg-orange-500",
  },
  "expense.updated": {
    label: (a, after) => `${a} updated expense "${after?.title ?? "an expense"}"`,
    icon: PenLine,
    iconClass: "text-blue-500",
    badgeVariant: "default",
    dot: "bg-blue-500",
  },
  "expense.deleted": {
    label: (a) => `${a} deleted an expense`,
    icon: Trash2,
    iconClass: "text-destructive",
    badgeVariant: "destructive",
    dot: "bg-destructive",
  },
  "settlement.created": {
    label: (a, after) =>
      `${a} settled ₹${Number(after?.amount ?? 0).toLocaleString("en-IN")}`,
    icon: ArrowLeftRight,
    iconClass: "text-emerald-500",
    badgeVariant: "success",
    dot: "bg-emerald-500",
  },
  "settlement.completed": {
    label: (a, after) =>
      `${a} completed a settlement of ₹${Number(after?.amount ?? 0).toLocaleString("en-IN")}`,
    icon: ShieldCheck,
    iconClass: "text-emerald-600",
    badgeVariant: "success",
    dot: "bg-emerald-600",
  },
  "chore.created": {
    label: (a, after) => `${a} created chore "${after?.title ?? "a chore"}"`,
    icon: Plus,
    iconClass: "text-violet-500",
    badgeVariant: "secondary",
    dot: "bg-violet-500",
  },
  "chore.updated": {
    label: (a, after) => `${a} updated chore "${after?.title ?? "a chore"}"`,
    icon: PenLine,
    iconClass: "text-violet-400",
    badgeVariant: "secondary",
    dot: "bg-violet-400",
  },
  "chore.completed": {
    label: (a, after) => `${a} completed chore "${after?.title ?? "a chore"}"`,
    icon: CheckSquare,
    iconClass: "text-emerald-500",
    badgeVariant: "success",
    dot: "bg-emerald-500",
  },
  "chore.deleted": {
    label: (a) => `${a} deleted a chore`,
    icon: Trash2,
    iconClass: "text-destructive",
    badgeVariant: "destructive",
    dot: "bg-destructive",
  },
  "member.joined": {
    label: (a) => `${a} joined the group`,
    icon: LogIn,
    iconClass: "text-blue-500",
    badgeVariant: "default",
    dot: "bg-blue-500",
  },
  "member.left": {
    label: (a) => `${a} left the group`,
    icon: LogOut,
    iconClass: "text-muted-foreground",
    badgeVariant: "outline",
    dot: "bg-slate-400",
  },
  "member.removed": {
    label: (a) => `${a} was removed from the group`,
    icon: Users,
    iconClass: "text-destructive",
    badgeVariant: "destructive",
    dot: "bg-destructive",
  },
  "member.role_changed": {
    label: (a, after) => `${a}'s role changed to ${after?.role ?? "a new role"}`,
    icon: ShieldCheck,
    iconClass: "text-primary",
    badgeVariant: "default",
    dot: "bg-primary",
  },
  "reminder.created": {
    label: (a, after) => `${a} set a reminder "${after?.title ?? "a reminder"}"`,
    icon: AlarmClock,
    iconClass: "text-amber-500",
    badgeVariant: "warning",
    dot: "bg-amber-500",
  },
  "reminder.deleted": {
    label: (a) => `${a} deleted a reminder`,
    icon: AlarmClock,
    iconClass: "text-muted-foreground",
    badgeVariant: "outline",
    dot: "bg-slate-400",
  },
  "notification.sent": {
    label: (a) => `${a} sent a notification`,
    icon: Bell,
    iconClass: "text-sky-500",
    badgeVariant: "default",
    dot: "bg-sky-500",
  },
};

const FALLBACK_CONFIG: ActionConfig = {
  label: (a) => `${a} performed an action`,
  icon: Activity,
  iconClass: "text-muted-foreground",
  badgeVariant: "outline",
  dot: "bg-slate-400",
};

function getConfig(action: string): ActionConfig {
  if (ACTION_MAP[action]) return ACTION_MAP[action];
  const parts = action.split(".");
  const guessed = `${parts[0]}.${parts[1]}`;
  return ACTION_MAP[guessed] ?? FALLBACK_CONFIG;
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function groupByDate(entries: Awaited<ReturnType<typeof getGroupActivity>>) {
  const groups: Record<string, typeof entries> = {};
  for (const e of entries) {
    const key = new Date(e.createdAt).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }
  return groups;
}

function dateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export async function ActivityFeed() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const entries = await getGroupActivity(session.user.id, 80);
  const grouped = groupByDate(entries);
  const dateKeys = Object.keys(grouped);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Group Activity
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Activity Log</h1>
          <p className="mt-1.5 text-base text-muted-foreground">
            Everything that&apos;s happened in your group, in one place.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-2xl bg-muted/60 border border-border/40">
          <span className="text-xs font-semibold text-muted-foreground">
            {entries.length} event{entries.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {entries.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-muted">
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Actions like adding expenses, completing chores and settling up will appear here.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timeline grouped by date */}
      {dateKeys.map((dateKey) => (
        <div key={dateKey} className="space-y-1">
          {/* Date separator */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {dateLabel(dateKey)}
            </span>
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground/60 tabular-nums">
              {grouped[dateKey].length}
            </span>
          </div>

          {/* Events card */}
          <Card className="border-border/60 overflow-hidden">
            <CardContent className="p-0">
              {grouped[dateKey].map((entry, idx) => {
                const config = getConfig(entry.action);
                const Icon = config.icon;
                const actor =
                  entry.userId === session.user.id ? "You" : (entry.userName ?? "Someone");
                const label = config.label(
                  actor,
                  entry.after as Record<string, unknown> | null
                );
                const timeAgo = formatDistanceToNow(new Date(entry.createdAt), {
                  addSuffix: true,
                });
                const isLast = idx === grouped[dateKey].length - 1;

                return (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors ${
                      !isLast ? "border-b border-border/40" : ""
                    }`}
                  >
                    {/* Colored dot */}
                    <div className="mt-2 shrink-0">
                      <span className={`block h-2 w-2 rounded-full ${config.dot}`} />
                    </div>

                    {/* Avatar */}
                    <Avatar className="h-9 w-9 shrink-0 ring-2 ring-border/40">
                      <AvatarImage src={entry.userImage ?? undefined} alt={entry.userName ?? "User avatar"} />
                      <AvatarFallback className="text-[11px] font-bold bg-muted text-muted-foreground">
                        {getInitials(entry.userName)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">
                        {label}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${config.iconClass}`} />
                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                      </div>
                    </div>

                    {/* Badge */}
                    <Badge
                      variant={config.badgeVariant}
                      className="shrink-0 text-[10px] font-bold capitalize hidden sm:inline-flex"
                    >
                      {entry.resource}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
