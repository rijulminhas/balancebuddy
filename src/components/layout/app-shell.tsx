"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface AppShellProps {
  session: Session;
  isSuperAdmin?: boolean;
  children: React.ReactNode;
}

export function AppShell({ session, isSuperAdmin = false, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} isSuperAdmin={isSuperAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header session={session} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
