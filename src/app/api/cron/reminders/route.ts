import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { and, eq, lte, isNotNull } from "drizzle-orm";
import { notifyUsers } from "@/lib/notify";
import {
  computeNextNotifyAt,
  buildNotificationTitle,
  buildNotificationBody,
} from "@/lib/reminders";
import type { ReminderFrequency } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const dueReminders = await db
    .select()
    .from(reminders)
    .where(
      and(
        eq(reminders.isActive, true),
        isNotNull(reminders.nextNotifyAt),
        lte(reminders.nextNotifyAt, now)
      )
    );

  if (!dueReminders.length) {
    return NextResponse.json({ processed: 0, failed: 0, total: 0 });
  }

  const results = await Promise.allSettled(
    dueReminders.map(async (reminder) => {
      const title = buildNotificationTitle(reminder.title, reminder.reminderDaysBefore);
      const body = buildNotificationBody(reminder.title, reminder.reminderDaysBefore, reminder.amount);

      await notifyUsers(
        [reminder.userId],
        reminder.groupId ?? null,
        "reminder",
        title,
        body,
        { url: "/reminders" }
      );

      const nextNotifyAt = computeNextNotifyAt(
        reminder.frequency as ReminderFrequency,
        reminder.reminderDaysBefore,
        {
          dayOfMonth: reminder.dayOfMonth,
          monthOfYear: reminder.monthOfYear,
          dayOfWeek: reminder.dayOfWeek,
          specificDate: reminder.specificDate,
        },
        now
      );

      await db
        .update(reminders)
        .set({
          lastNotifiedAt: now,
          // one_time reminders deactivate after firing
          isActive: reminder.frequency !== "one_time",
          nextNotifyAt: nextNotifyAt ?? null,
          updatedAt: now,
        })
        .where(eq(reminders.id, reminder.id));
    })
  );

  const processed = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ processed, failed, total: dueReminders.length });
}
