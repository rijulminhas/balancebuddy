import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { messages, groupMembers, users, notifications, messageReactions } from "@/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { ChatWindow } from "@/components/chat/chat-window";
import { isSuperAdmin } from "@/lib/super-admin";
import type { ReactionGroup, ReplyPreview, MessageType } from "@/types/chat";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

const INITIAL_LOAD = 50;

function groupReactionsByMessage(
  raw: { messageId: string; emoji: string; userId: string }[],
): Map<string, ReactionGroup[]> {
  const emojiMap = new Map<string, Map<string, string[]>>();
  for (const r of raw) {
    if (!emojiMap.has(r.messageId)) emojiMap.set(r.messageId, new Map());
    const byEmoji = emojiMap.get(r.messageId)!;
    if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, []);
    byEmoji.get(r.emoji)!.push(r.userId);
  }
  const result = new Map<string, ReactionGroup[]>();
  for (const [msgId, byEmoji] of emojiMap) {
    result.set(
      msgId,
      Array.from(byEmoji.entries()).map(([emoji, userIds]) => ({
        emoji,
        count: userIds.length,
        userIds,
      })),
    );
  }
  return result;
}

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
      replyToId: messages.replyToId,
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
  const data = rows.slice(0, INITIAL_LOAD).reverse();

  const messageIds = data.map((r) => r.id);
  const replyToIds = data.map((r) => r.replyToId).filter(Boolean) as string[];

  const [reactionsRaw, replyMessages] = await Promise.all([
    messageIds.length
      ? db
          .select({
            messageId: messageReactions.messageId,
            emoji: messageReactions.emoji,
            userId: messageReactions.userId,
          })
          .from(messageReactions)
          .where(inArray(messageReactions.messageId, messageIds))
      : Promise.resolve([]),
    replyToIds.length
      ? db
          .select({
            id: messages.id,
            senderName: users.name,
            content: messages.content,
            type: messages.type,
            isDeleted: messages.isDeleted,
          })
          .from(messages)
          .leftJoin(users, eq(messages.senderId, users.id))
          .where(inArray(messages.id, replyToIds))
      : Promise.resolve([]),
  ]);

  const reactionsMap = groupReactionsByMessage(reactionsRaw);
  const replyMap = new Map(replyMessages.map((r) => [r.id, r]));

  const initial = data.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.senderName ?? null,
    senderImage: m.senderImage ?? null,
    content: m.content,
    type: m.type as MessageType,
    metadata: (m.metadata ?? null) as Record<string, unknown> | null,
    replyToId: m.replyToId ?? null,
    replyTo: m.replyToId
      ? ((replyMap.get(m.replyToId) as ReplyPreview | undefined) ?? null)
      : null,
    reactions: reactionsMap.get(m.id) ?? [],
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
