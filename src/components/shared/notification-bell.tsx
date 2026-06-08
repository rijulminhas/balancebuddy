"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/notifications/unread-count")
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => {});
  }, [pathname]); // re-fetch when navigating

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-accent"
      asChild
    >
      <Link href="/notifications" aria-label="Notifications">
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground ring-2 ring-card">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
