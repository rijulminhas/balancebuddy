import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { messages, groupMembers, users, messageReactions } from "@/db/schema";
import { eq, and, desc, lt, ne, inArray } from "drizzle-orm";
import { z } from "zod";
import { notifyUsers } from "@/lib/notify";
import type { ReactionGroup, ReplyPreview, MessageType } from "@/types/chat";

const PAGE_SIZE = 50;
const CHAT_TYPES = ["text", "image"] as const;

async function getActiveGroupId(userId: string): Promise<string | null> {
  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .orderBy(desc(groupMembers.joinedAt))
    .limit(1);
  return membership?.groupId ?? null;
}

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

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = await getActiveGroupId(session.user.id);
  if (!groupId) return NextResponse.json({ error: "No active group" }, { status: 404 });

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

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "image"]).default("text"),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  replyToId: z.uuid().nullish(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const groupId = await getActiveGroupId(session.user.id);
  if (!groupId) return NextResponse.json({ error: "No active group" }, { status: 404 });

  const body: unknown = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { type, metadata, replyToId } = parsed.data;
  const content = type === "text" ? parsed.data.content.trim() : parsed.data.content;
  if (!content) return NextResponse.json({ error: "Invalid message" }, { status: 400 });

  // Validate replyToId belongs to the same group
  if (replyToId) {
    const [refMsg] = await db
      .select({ groupId: messages.groupId })
      .from(messages)
      .where(eq(messages.id, replyToId))
      .limit(1);
    if (!refMsg || refMsg.groupId !== groupId) {
      return NextResponse.json({ error: "Invalid replyToId" }, { status: 400 });
    }
  }

  const [msg] = await db
    .insert(messages)
    .values({
      groupId,
      senderId: session.user.id,
      type,
      content,
      metadata: (metadata ?? null) as Record<string, unknown> | null,
      replyToId: replyToId ?? null,
    })
    .returning({
      id: messages.id,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      metadata: messages.metadata,
      replyToId: messages.replyToId,
      createdAt: messages.createdAt,
    });

  let replyTo: ReplyPreview | null = null;
  if (msg.replyToId) {
    const [ref] = await db
      .select({
        id: messages.id,
        senderName: users.name,
        content: messages.content,
        type: messages.type,
        isDeleted: messages.isDeleted,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.id, msg.replyToId))
      .limit(1);
    if (ref) replyTo = { ...ref, type: ref.type as MessageType };
  }

  const otherMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, "active"),
        ne(groupMembers.userId, session.user.id),
      ),
    );

  const otherIds = otherMembers.map((m) => m.userId);
  if (otherIds.length > 0) {
    const notifBody =
      type === "image" ? "📷 Sent an image" : content.slice(0, 100);
    await notifyUsers(
      otherIds,
      groupId,
      "general",
      `New message from ${session.user.name ?? "a member"}`,
      notifBody,
      { url: "/chat" },
    );
  }

  return NextResponse.json({
    id: msg.id,
    senderId: msg.senderId,
    senderName: session.user.name ?? null,
    senderImage: session.user.image ?? null,
    content: msg.content,
    type: msg.type,
    metadata: msg.metadata,
    replyToId: msg.replyToId,
    replyTo,
    reactions: [],
    createdAt: msg.createdAt.toISOString(),
  });
}
