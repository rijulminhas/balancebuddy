"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { PfSidebar } from "./pf-sidebar";
import { PfHeader } from "./pf-header";

interface PfShellProps {
  session: Session;
  children: React.ReactNode;
}

export function PfShell({ session, children }: PfShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-40 flex bg-background">
      <PfSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <PfHeader
          session={session}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
