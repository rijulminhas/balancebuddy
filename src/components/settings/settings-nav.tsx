"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
}

interface SettingsNavProps {
  items: NavItem[];
}

export function SettingsNav({ items }: SettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible md:w-44 shrink-0 pb-1 md:pb-0">
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
