import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { messages, groupMembers, users } from "@/db/schema";
import { eq, and, desc, lt, ne, inArray } from "drizzle-orm";
import { z } from "zod";
import { notifyUsers } from "@/lib/notify";

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
      content: messages.content,
      type: messages.type,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(whereClause)
    .orderBy(desc(messages.createdAt))
    .limit(PAGE_SIZE + 1);

  const hasMore = rows.length > PAGE_SIZE;
  const data = rows.slice(0, PAGE_SIZE).reverse();

  return NextResponse.json({
    messages: data.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    hasMore,
  });
}

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["text", "image"]).default("text"),
  metadata: z.record(z.string(), z.unknown()).nullish(),
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

  const { type, metadata } = parsed.data;
  const content = type === "text" ? parsed.data.content.trim() : parsed.data.content;
  if (!content) return NextResponse.json({ error: "Invalid message" }, { status: 400 });

  const [msg] = await db
    .insert(messages)
    .values({
      groupId,
      senderId: session.user.id,
      type,
      content,
      metadata: (metadata ?? null) as Record<string, unknown> | null,
    })
    .returning({
      id: messages.id,
      senderId: messages.senderId,
      content: messages.content,
      type: messages.type,
      metadata: messages.metadata,
      createdAt: messages.createdAt,
    });

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
      type === "image"
        ? "📷 Sent an image"
        : content.slice(0, 100);

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
    content: msg.content,
    type: msg.type,
    metadata: msg.metadata,
    createdAt: msg.createdAt.toISOString(),
  });
}
