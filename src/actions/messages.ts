"use server";

import { db } from "@/db";
import { messages, groupMembers, notifications, auditLogs, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notify";
import { isSuperAdmin } from "@/lib/super-admin";
import type { ActionResult } from "./auth";

export async function resetGroupChat(
  userId: string,
  groupId: string
): Promise<ActionResult> {
  const [requester] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const userIsSuperAdmin = isSuperAdmin(requester?.email);

  const [membership] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership && !userIsSuperAdmin)
    return { success: false, error: "Not a member of this group" };

  if (!userIsSuperAdmin && membership!.role !== "owner" && membership!.role !== "admin") {
    return { success: false, error: "Only owners and admins can reset the group chat" };
  }

  const now = new Date();

  await db
    .update(messages)
    .set({ isDeleted: true, deletedAt: now, updatedAt: now })
    .where(and(eq(messages.groupId, groupId), eq(messages.isDeleted, false)));

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.groupId, groupId),
        eq(notifications.type, "general")
      )
    );

  await db.insert(auditLogs).values({
    groupId,
    userId,
    action: "chat.reset",
    resource: "messages",
    resourceId: groupId,
    after: { resetAt: now.toISOString() },
  });

  const activeMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));

  const memberIds = activeMembers.map((m) => m.userId);
  if (memberIds.length > 0) {
    await notifyUsers(
      memberIds,
      groupId,
      "general",
      "Chat history cleared",
      `${requester?.name ?? "An admin"} cleared the group chat history.`,
      { url: "/chat" }
    );
  }

  revalidatePath("/chat");

  // Notify all connected WS clients so they clear their chat state in real-time
  const wsUrl = process.env.WS_INTERNAL_URL;
  const wsSecret = process.env.WS_INTERNAL_SECRET;
  if (wsUrl && wsSecret) {
    try {
      await fetch(`${wsUrl}/internal/chat-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": wsSecret },
        body: JSON.stringify({ groupId }),
      });
    } catch {
      // Non-fatal — clients will see the reset on next reconnect/page load
    }
  }

  return { success: true };
}
