"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSidebarCounts } from "@/store/sidebar-counts";

export function NotificationBell() {
  const { unreadCount } = useSidebarCounts();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
      asChild
    >
      <Link href="/notifications" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-card">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>
    </Button>
  );
}
