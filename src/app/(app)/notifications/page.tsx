import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bell,
  Receipt,
  CheckSquare,
  ArrowLeftRight,
  Users,
  ShoppingCart,
  Info,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { MarkAllReadButton } from "./mark-all-read-button";
import { EnablePushButton } from "./enable-push-button";

export const metadata: Metadata = { title: "Notifications" };

const typeConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  expense_added: { icon: Receipt, color: "text-orange-500", bg: "bg-orange-500/10" },
  expense_updated: { icon: Receipt, color: "text-orange-500", bg: "bg-orange-500/10" },
  chore_assigned: { icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  chore_completed: { icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  settlement_requested: { icon: ArrowLeftRight, color: "text-violet-500", bg: "bg-violet-500/10" },
  settlement_completed: { icon: ArrowLeftRight, color: "text-violet-500", bg: "bg-violet-500/10" },
  flat_invitation: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  member_joined: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  member_left: { icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
  bill_due: { icon: Receipt, color: "text-destructive", bg: "bg-destructive/10" },
  low_stock: { icon: ShoppingCart, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  general: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const allNotifications = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;

  // Group by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped: { label: string; items: typeof allNotifications }[] = [];

  const todayItems = allNotifications.filter(
    (n) => new Date(n.createdAt) >= today
  );
  const yesterdayItems = allNotifications.filter((n) => {
    const d = new Date(n.createdAt);
    return d >= yesterday && d < today;
  });
  const earlierItems = allNotifications.filter(
    (n) => new Date(n.createdAt) < yesterday
  );

  if (todayItems.length) grouped.push({ label: "Today", items: todayItems });
  if (yesterdayItems.length)
    grouped.push({ label: "Yesterday", items: yesterdayItems });
  if (earlierItems.length)
    grouped.push({ label: "Earlier", items: earlierItems });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <MarkAllReadButton userId={session.user.id} />
        )}
      </div>

      <EnablePushButton />

      {allNotifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="mb-4 h-10 w-10 text-muted-foreground/40" />
            <p className="mb-1 text-sm font-medium">No notifications yet</p>
            <p className="text-xs text-muted-foreground">
              You&apos;ll be notified about expenses, chores, and settlements.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label} className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">
                {group.label}
              </p>
              <Card className="border-border/60 overflow-hidden">
                <CardContent className="p-0 divide-y divide-border/50">
                  {group.items.map((n) => {
                    const cfg = typeConfig[n.type] ?? typeConfig.general;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={n.id}
                        className={`flex items-start gap-4 px-4 py-3.5 transition-colors ${
                          !n.isRead ? "bg-primary/3" : ""
                        }`}
                      >
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}
                        >
                          <Icon className={`h-4 w-4 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight">
                              {n.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {!n.isRead && (
                                <span className="h-2 w-2 rounded-full bg-primary" />
                              )}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(new Date(n.createdAt), {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
