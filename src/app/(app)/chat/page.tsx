import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { messages, groupMembers, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { ChatWindow } from "@/components/chat/chat-window";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

const INITIAL_LOAD = 50;

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
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

  const rows = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      senderName: users.name,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      and(
        eq(messages.groupId, groupId),
        eq(messages.type, "text"),
        eq(messages.isDeleted, false),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(INITIAL_LOAD + 1);

  const hasMoreInitial = rows.length > INITIAL_LOAD;
  const initial = rows
    .slice(0, INITIAL_LOAD)
    .reverse()
    .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  return (
    <ChatWindow
      initialMessages={initial}
      currentUserId={session.user.id}
      hasMoreInitial={hasMoreInitial}
    />
  );
}
