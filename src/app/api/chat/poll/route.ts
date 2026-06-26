import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { messages, groupMembers, users, messageReactions } from "@/db/schema";
import { eq, and, desc, asc, gt, or, inArray } from "drizzle-orm";
import type { ReactionGroup, ReplyPreview } from "@/types/chat";

async function getActiveGroupId(userId: string): Promise<string | null> {
  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .orderBy(desc(groupMembers.joinedAt))
    .limit(1);
  return membership?.groupId ?? null;
}

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

  const since = req.nextUrl.searchParams.get("since");
  const updatedSince = req.nextUrl.searchParams.get("updatedSince");

  if (!since) return NextResponse.json({ messages: [] });

  const sinceDate = new Date(since);
  if (isNaN(sinceDate.getTime())) return NextResponse.json({ messages: [] });

  // Use the groupId passed by the client to skip a DB round-trip.
  // Fall back to a DB lookup only if the param is missing (backwards compat).
  const groupIdParam = req.nextUrl.searchParams.get("groupId");
  const groupId = groupIdParam ?? (await getActiveGroupId(session.user.id));
  if (!groupId) return NextResponse.json({ messages: [] });

  const updatedSinceDate =
    updatedSince && !isNaN(new Date(updatedSince).getTime())
      ? new Date(updatedSince)
      : null;

  const baseFilter = and(
    eq(messages.groupId, groupId),
    inArray(messages.type, [...CHAT_TYPES]),
    eq(messages.isDeleted, false),
  );

  // Return new messages (createdAt > since) OR messages whose reactions changed
  // (updatedAt > updatedSince). The client differentiates new vs updated by ID.
  const whereClause =
    updatedSinceDate
      ? and(
          baseFilter,
          or(
            gt(messages.createdAt, sinceDate),
            gt(messages.updatedAt, updatedSinceDate),
          ),
        )
      : and(baseFilter, gt(messages.createdAt, sinceDate));

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
    .orderBy(asc(messages.createdAt));

  if (!rows.length) return NextResponse.json({ messages: [] });

  const messageIds = rows.map((r) => r.id);
  const replyToIds = rows.map((r) => r.replyToId).filter(Boolean) as string[];

  const [reactionsRaw, replyMessages] = await Promise.all([
    db
      .select({
        messageId: messageReactions.messageId,
        emoji: messageReactions.emoji,
        userId: messageReactions.userId,
        userName: users.name,
      })
      .from(messageReactions)
      .leftJoin(users, eq(messageReactions.userId, users.id))
      .where(inArray(messageReactions.messageId, messageIds)),
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
    messages: rows.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      reactions: reactionsMap.get(m.id) ?? [],
      replyTo: m.replyToId
        ? ((replyMap.get(m.replyToId) as ReplyPreview | undefined) ?? null)
        : null,
    })),
  });
}
