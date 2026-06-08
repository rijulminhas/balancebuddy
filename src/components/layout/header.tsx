"use client";

import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import { LogOut, Menu, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { NotificationBell } from "@/components/shared/notification-bell";

interface HeaderProps {
  session: Session;
  onMenuClick?: () => void;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function Header({ session, onMenuClick }: HeaderProps) {
  const { user } = session;

  return (
    <header className="flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 sm:px-6 shrink-0">
      {/* Left — hamburger on mobile */}
      <button
        onClick={onMenuClick}
        className="flex md:hidden items-center justify-center rounded-xl p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="hidden md:block" />

      {/* Right */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-2.5 py-1.5 hover:bg-sidebar-accent transition-colors">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-semibold max-w-[120px] truncate">
                {user.name}
              </span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg font-medium cursor-pointer">
              <Link href="/settings/profile">
                <User className="mr-2 h-4 w-4" />Profile
              </Link>
            </DropdownMenuItem>
            {/* <DropdownMenuItem asChild className="rounded-lg font-medium cursor-pointer">
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />Settings
              </Link>
            </DropdownMenuItem> */}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="rounded-lg font-semibold text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
