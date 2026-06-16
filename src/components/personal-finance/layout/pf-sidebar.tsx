"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  LineChart,
  PiggyBank,
  CreditCard,
  Shield,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const pfNavItems = [
  { href: "/personal-finance", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/personal-finance/income", label: "Income", icon: TrendingUp },
  { href: "/personal-finance/expenses", label: "Expenses", icon: TrendingDown },
  { href: "/personal-finance/investments", label: "Investments", icon: LineChart },
  { href: "/personal-finance/savings", label: "Savings Goals", icon: PiggyBank },
  { href: "/personal-finance/loans", label: "Loans & EMI", icon: CreditCard },
  { href: "/personal-finance/net-worth", label: "Net Worth", icon: Shield },
  { href: "/personal-finance/analytics", label: "Analytics", icon: BarChart3 },
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

interface PfNavContentProps {
  collapsed?: boolean;
  onNavClick?: () => void;
}

function PfNavContent({ collapsed = false, onNavClick }: PfNavContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <>
      {/* Logo / branding */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border shrink-0",
          collapsed ? "justify-center" : "px-5 gap-3"
        )}
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl">
          <Image
            src="/images/balance.jpg"
            alt="BalanceBuddy Logo"
            fill
            sizes="36px"
            className="object-contain"
            priority
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight text-sidebar-foreground truncate">
              Personal Finance
            </p>
            <p className="text-[10px] text-sidebar-foreground/40 font-semibold truncate">
              BalanceBuddy
            </p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scrollbar-none">
        {pfNavItems.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
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
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
              {!collapsed && <span className="flex-1">{label}</span>}
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

      {/* User info + sign out */}
      <div className="border-t border-sidebar-border p-3 space-y-1 shrink-0">
        {session?.user && (
          <div
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 bg-sidebar-accent/50",
              collapsed && "justify-center px-0 bg-transparent"
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
            <TooltipContent side="right" className="font-semibold text-destructive">
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

interface PfSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function PfSidebar({ mobileOpen = false, onMobileClose }: PfSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "relative hidden md:flex h-full flex-col transition-all duration-200 ease-in-out shrink-0",
          "bg-sidebar border-r border-sidebar-border",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <PfNavContent collapsed={collapsed} />

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

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="flex flex-col gap-0 p-0 w-72 bg-sidebar border-sidebar-border"
        >
          <SheetTitle className="sr-only">Personal Finance Navigation</SheetTitle>
          <PfNavContent onNavClick={onMobileClose} />
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
