import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Bell } from "lucide-react";
import { RemindersClient } from "./reminders-client";

export const metadata = { title: "Reminders · BalanceBuddy" };

export default async function RemindersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const rows = await db
    .select()
    .from(reminders)
    .where(eq(reminders.userId, session.user.id))
    .orderBy(desc(reminders.createdAt));

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Reminders</h1>
            <p className="text-xs text-muted-foreground">
              Get push notifications before bills are due
            </p>
          </div>
        </div>
      </div>

      <RemindersClient initialReminders={rows} />
    </div>
  );
}
