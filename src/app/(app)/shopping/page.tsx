import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MonthlyEssentialsPage } from "@/components/shopping/monthly-essentials-page";
import { ShoppingListPage } from "@/components/shopping/shopping-list-page";

export const metadata: Metadata = { title: "Shopping" };

interface ShoppingPageProps {
  searchParams: Promise<{ tab?: string; archived?: string }>;
}

export default async function ShoppingPage({ searchParams }: ShoppingPageProps) {
  const { tab, archived } = await searchParams;
  const activeTab = tab === "list" ? "list" : "essentials";
  const showArchived = archived === "1";

  return (
    <div className="space-y-6">
      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl border border-border/60 bg-muted/30 p-1 w-fit">
        <TabLink
          href="/shopping"
          active={activeTab === "essentials"}
          label="Monthly Essentials"
        />
        <TabLink
          href="/shopping?tab=list"
          active={activeTab === "list"}
          label="Shopping List"
        />
      </div>

      {/* Archived toggle — only on essentials tab */}
      {activeTab === "essentials" && (
        <div className="flex items-center gap-2">
          <Link
            href={showArchived ? "/shopping" : "/shopping?archived=1"}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline hover:text-foreground transition-colors"
          >
            {showArchived ? "← Show active items" : "View archived items"}
          </Link>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "essentials" ? (
        <MonthlyEssentialsPage showArchived={showArchived} />
      ) : (
        <ShoppingListPage />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );
}
