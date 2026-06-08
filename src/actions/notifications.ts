"use server";

import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";

export async function markNotificationsRead(
  userId: string,
  notificationIds?: string[]
): Promise<ActionResult> {
  if (notificationIds && notificationIds.length > 0) {
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, notificationIds)
        )
      );
  } else {
    // Mark all as read
    await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(notifications.userId, userId));
  }

  revalidatePath("/notifications");

  return { success: true };
}
