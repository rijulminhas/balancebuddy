"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Home,
  Receipt,
  ArrowLeftRight,
  CheckSquare,
  Bell,
  AlarmClock,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  History,
  Activity,
  ShoppingCart,
  ShieldCheck,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useSidebarCounts } from "@/store/sidebar-counts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/groups", label: "My Group", icon: Home },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/history", label: "Room History", icon: History },
  { href: "/settlements", label: "Settlements", icon: ArrowLeftRight },
  { href: "/chores", label: "Chores", icon: CheckSquare },
  { href: "/chat", label: "Group Chat", icon: MessageSquare },
  { href: "/activity", label: "Activity Log", icon: Activity },
  { href: "/reminders", label: "Reminders", icon: AlarmClock },
  { href: "/shopping", label: "Shopping", icon: ShoppingCart },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/profile", label: "Profile Settings", icon: Settings },
];

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ── Shared nav content rendered in both desktop sidebar and mobile Sheet ──

interface NavContentProps {
  collapsed?: boolean;
  onNavClick?: () => void;
  unreadCount: number;
  historyCount: number;
  unreadChat: number;
  isSuperAdmin?: boolean;
}

function NavContent({
  collapsed = false,
  onNavClick,
  unreadCount,
  historyCount,
  unreadChat,
  isSuperAdmin = false,
}: NavContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Logo */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center" : "px-5",
        )}
      >
        <Link
          href="/"
          onClick={onNavClick}
          className="flex items-center gap-3"
        >
          {/* <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-md shadow-primary/25">
            BB
          </div> */}
          <div className={cn(
            "relative shrink-0 overflow-hidden rounded-xl",
            collapsed ? "h-8 w-8" : "h-45 w-45",
          )}>
            <Image
              src="/images/balancebuddylogo.png"
              alt="BalanceBuddy Logo"
              fill
              sizes={collapsed ? "32px" : "180px"}
              className="object-contain"
              priority
            />
          </div>
          {/* {!collapsed && (
            <span className="text-base font-black tracking-tight text-sidebar-foreground">
              BalanceBuddy
            </span>
          )} */}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
            Menu
          </p>
        )} */}

        {[
          ...navItems,
          ...(isSuperAdmin
            ? [{ href: "/admin/feedback", label: "Feedback Management", icon: ShieldCheck }]
            : []),
        ].map(({ href, label, icon: Icon }) => {
          if (href === "/groups/history" && historyCount === 0) return null;

          const active =
            href === "/groups"
              ? pathname === "/groups"
              : pathname === href || pathname.startsWith(href + "/");

          const item = (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                collapsed && "justify-center",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon
                className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")}
              />
              {!collapsed && <span className="flex-1">{label}</span>}
              {href === "/notifications" && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-sidebar">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
              {/* {href === "/chat" && unreadChat > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white ring-2 ring-sidebar">
                  {unreadChat > 9 ? "9+" : unreadChat}
                </span>
              )} */}
            </Link>
          );

          if (collapsed) {
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>{item}</TooltipTrigger>
                <TooltipContent side="right" className="font-semibold">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          }
          return item;
        })}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="border-t border-sidebar-border p-3 space-y-1 shrink-0">
        {session?.user && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 bg-sidebar-accent/50",
              collapsed && "justify-center px-0 bg-transparent",
            )}
          >
            <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User avatar"} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {getInitials(session.user.name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-sidebar-foreground">
                  {session.user.name}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">
                  {session.user.email}
                </p>
              </div>
            )}
          </div>
        )}

        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center justify-center rounded-xl py-2.5 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="font-semibold text-destructive"
            >
              Sign Out
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </>
  );
}

// ── Main Sidebar export ──

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  isSuperAdmin?: boolean;
}

export function Sidebar({ mobileOpen = false, onMobileClose, isSuperAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { unreadCount, historyCount, unreadChat, setCounts } = useSidebarCounts();

  // Close mobile sheet on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Single fetch for both counts — polled every 60s, not on every navigation.
  useEffect(() => {
    const load = () => {
      fetch("/api/sidebar-counts")
        .then((r) => r.json())
        .then((d) => setCounts(d.unread ?? 0, d.history ?? 0, d.unreadChat ?? 0))
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TooltipProvider delayDuration={0}>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside
        className={cn(
          "relative hidden md:flex h-full flex-col transition-all duration-200 ease-in-out shrink-0",
          "bg-sidebar border-r border-sidebar-border",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <NavContent
          collapsed={collapsed}
          unreadCount={unreadCount}
          historyCount={historyCount}
          unreadChat={unreadChat}
          isSuperAdmin={isSuperAdmin}
        />

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border px-3 pb-3 pt-1 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Mobile Sheet (visible on mobile only) ── */}
      <Sheet
        open={mobileOpen}
        onOpenChange={(open) => !open && onMobileClose?.()}
      >
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex flex-col gap-0 p-0 w-72 bg-sidebar border-sidebar-border"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <NavContent
            onNavClick={onMobileClose}
            unreadCount={unreadCount}
            historyCount={historyCount}
            unreadChat={unreadChat}
            isSuperAdmin={isSuperAdmin}
          />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
