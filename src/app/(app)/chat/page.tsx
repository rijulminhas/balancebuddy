import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { messages, groupMembers, users, notifications } from "@/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { ChatWindow } from "@/components/chat/chat-window";
import { isSuperAdmin } from "@/lib/super-admin";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

const INITIAL_LOAD = 50;

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ groupId: groupMembers.groupId, role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active"),
      ),
    )
    .orderBy(desc(groupMembers.joinedAt))
    .limit(1);

  if (!membership) redirect("/groups");

  const { groupId } = membership;

  // Mark all unread chat notifications as read when the user opens the chat page.
  // Runs server-side — no extra client API call needed.
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false),
        sql`${notifications.data}->>'url' = '/chat'`,
      ),
    );

  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      senderName: users.name,
      senderImage: users.image,
      content: messages.content,
      type: messages.type,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      and(
        eq(messages.groupId, groupId),
        inArray(messages.type, ["text", "image"]),
        eq(messages.isDeleted, false),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(INITIAL_LOAD + 1);

  const hasMoreInitial = rows.length > INITIAL_LOAD;
  const initial = rows
    .slice(0, INITIAL_LOAD)
    .reverse()
    .map((m) => ({
      ...m,
      senderImage: m.senderImage ?? null,
      type: m.type as "text" | "image",
      metadata: (m.metadata ?? null) as Record<string, unknown> | null,
      createdAt: m.createdAt.toISOString(),
    }));

  return (
    <ChatWindow
      initialMessages={initial}
      currentUserId={session.user.id}
      hasMoreInitial={hasMoreInitial}
      groupId={groupId}
      userRole={membership.role}
      isSuperAdmin={isSuperAdmin(session.user.email)}
    />
  );
}
