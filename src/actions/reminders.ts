"use server";

import { db } from "@/db";
import { reminders, groupMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { computeNextNotifyAt, reminderInputSchema, type ReminderInput } from "@/lib/reminders";
import type { ActionResult } from "./auth";

function extractFields(data: ReminderInput) {
  const {
    groupId,
    specificDate,
    dayOfMonth,
    monthOfYear,
    dayOfWeek,
    reminderDaysBefore,
    amount,
    ...rest
  } = data;

  const specificDateObj = specificDate ? new Date(specificDate) : null;

  const daysBefore = reminderDaysBefore ?? 1;
  const nextNotifyAt = computeNextNotifyAt(rest.frequency, daysBefore, {
    dayOfMonth,
    monthOfYear,
    dayOfWeek,
    specificDate: specificDateObj,
  });

  return {
    groupId: groupId ?? null,
    dayOfMonth: dayOfMonth ?? null,
    monthOfYear: monthOfYear ?? null,
    dayOfWeek: dayOfWeek ?? null,
    specificDate: specificDateObj,
    reminderDaysBefore: daysBefore,
    amount: amount ?? null,
    nextNotifyAt: nextNotifyAt ?? undefined,
    ...rest,
  };
}

export async function createReminder(
  userId: string,
  input: ReminderInput
): Promise<ActionResult<{ reminderId: string }>> {
  const parsed = reminderInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const fields = extractFields(parsed.data);

  if (fields.groupId) {
    const [membership] = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, fields.groupId),
          eq(groupMembers.userId, userId),
          eq(groupMembers.status, "active")
        )
      )
      .limit(1);

    if (!membership) return { success: false, error: "Not a member of this group" };
  }

  const [reminder] = await db
    .insert(reminders)
    .values({ userId, ...fields })
    .returning({ id: reminders.id });

  revalidatePath("/reminders");
  return { success: true, data: { reminderId: reminder.id } };
}

export async function updateReminder(
  userId: string,
  reminderId: string,
  input: ReminderInput
): Promise<ActionResult> {
  const parsed = reminderInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [existing] = await db
    .select({ id: reminders.id })
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1);

  if (!existing) return { success: false, error: "Reminder not found" };

  const fields = extractFields(parsed.data);

  await db
    .update(reminders)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(reminders.id, reminderId));

  revalidatePath("/reminders");
  return { success: true };
}

export async function toggleReminderActive(
  userId: string,
  reminderId: string,
  isActive: boolean
): Promise<ActionResult> {
  const [existing] = await db
    .select()
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1);

  if (!existing) return { success: false, error: "Reminder not found" };

  let nextNotifyAt = existing.nextNotifyAt;

  // Recompute when re-activating so the next trigger is in the future
  if (isActive) {
    nextNotifyAt = computeNextNotifyAt(
      existing.frequency as Parameters<typeof computeNextNotifyAt>[0],
      existing.reminderDaysBefore,
      {
        dayOfMonth: existing.dayOfMonth,
        monthOfYear: existing.monthOfYear,
        dayOfWeek: existing.dayOfWeek,
        specificDate: existing.specificDate,
      }
    );
  }

  await db
    .update(reminders)
    .set({ isActive, nextNotifyAt: nextNotifyAt ?? undefined, updatedAt: new Date() })
    .where(eq(reminders.id, reminderId));

  revalidatePath("/reminders");
  return { success: true };
}

export async function deleteReminder(
  userId: string,
  reminderId: string
): Promise<ActionResult> {
  const [existing] = await db
    .select({ id: reminders.id })
    .from(reminders)
    .where(and(eq(reminders.id, reminderId), eq(reminders.userId, userId)))
    .limit(1);

  if (!existing) return { success: false, error: "Reminder not found" };

  await db.delete(reminders).where(eq(reminders.id, reminderId));

  revalidatePath("/reminders");
  return { success: true };
}
