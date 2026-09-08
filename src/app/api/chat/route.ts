import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { messages, groupMembers, users, messageReactions } from "@/db/schema";
import { eq, and, desc, lt, inArray } from "drizzle-orm";
import type { ReactionGroup } from "@/types/chat";

const PAGE_SIZE = 50;
const CHAT_TYPES = ["text", "image", "system", "expense_update", "chore_update", "settlement_update"] as const;

function groupReactionsByMessage(
  raw: { messageId: string; emoji: string; userId: string; userName: string | null }[],
): Map<string, ReactionGroup[]> {
  const emojiMap = new Map<string, Map<string, { userIds: string[]; userNames: string[] }>>();
  for (const r of raw) {
    if (!emojiMap.has(r.messageId)) emojiMap.set(r.messageId, new Map());
    const byEmoji = emojiMap.get(r.messageId)!;
    if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, { userIds: [], userNames: [] });
    const entry = byEmoji.get(r.emoji)!;
    entry.userIds.push(r.userId);
    entry.userNames.push(r.userName ?? "Unknown");
  }
  const result = new Map<string, ReactionGroup[]>();
  for (const [msgId, byEmoji] of emojiMap) {
    result.set(
      msgId,
      Array.from(byEmoji.entries()).map(([emoji, { userIds, userNames }]) => ({
        emoji,
        count: userIds.length,
        userIds,
        userNames,
      })),
    );
  }
  return result;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify the requested groupId is one the user actually belongs to
  const groupIdParam = req.nextUrl.searchParams.get("groupId");
  if (!groupIdParam) return NextResponse.json({ error: "groupId required" }, { status: 400 });

  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.groupId, groupIdParam),
        eq(groupMembers.status, "active"),
      ),
    )
    .limit(1);

  if (!membership) return NextResponse.json({ error: "No active group" }, { status: 404 });
  const groupId = membership.groupId;

  const cursor = req.nextUrl.searchParams.get("cursor");

  const baseWhere = and(
    eq(messages.groupId, groupId),
    inArray(messages.type, [...CHAT_TYPES]),
    eq(messages.isDeleted, false),
  );
  const whereClause = cursor
    ? and(baseWhere, lt(messages.createdAt, new Date(cursor)))
    : baseWhere;

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
    .where(whereClause)
    .orderBy(desc(messages.createdAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const data = rows.slice(0, PAGE_SIZE).reverse();

  const messageIds = data.map((r) => r.id);
  const replyToIds = data.map((r) => r.replyToId).filter(Boolean) as string[];

  const [reactionsRaw, replyMessages] = await Promise.all([
    messageIds.length
      ? db
          .select({
            messageId: messageReactions.messageId,
            emoji: messageReactions.emoji,
            userId: messageReactions.userId,
            userName: users.name,
          })
          .from(messageReactions)
          .leftJoin(users, eq(messageReactions.userId, users.id))
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

  return NextResponse.json({
    messages: data.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      reactions: reactionsMap.get(m.id) ?? [],
      replyTo: m.replyToId
        ? (replyMap.get(m.replyToId) ?? null)
        : null,
    })),
    hasMore,
  });
}
