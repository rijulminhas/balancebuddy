import type { Metadata } from "next";
import { SettingsNav } from "@/components/settings/settings-nav";

export const metadata: Metadata = { title: "Settings" };

const navItems = [
  { href: "/settings/profile", label: "Profile" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>
      <div className="flex flex-col gap-8 md:flex-row">
        {/* <SettingsNav items={navItems} /> */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
