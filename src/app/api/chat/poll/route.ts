import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { messages, groupMembers, users } from "@/db/schema";
import { eq, and, desc, asc, gt, inArray } from "drizzle-orm";

async function getActiveGroupId(userId: string): Promise<string | null> {
  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .orderBy(desc(groupMembers.joinedAt))
    .limit(1);
  return membership?.groupId ?? null;
}

const CHAT_TYPES = ["text", "image"] as const;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const since = req.nextUrl.searchParams.get("since");
  if (!since) return NextResponse.json({ messages: [] });

  const sinceDate = new Date(since);
  if (isNaN(sinceDate.getTime())) return NextResponse.json({ messages: [] });

  const groupId = await getActiveGroupId(session.user.id);
  if (!groupId) return NextResponse.json({ messages: [] });

  const newMsgs = await db
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
    .where(
      and(
        eq(messages.groupId, groupId),
        inArray(messages.type, [...CHAT_TYPES]),
        eq(messages.isDeleted, false),
        gt(messages.createdAt, sinceDate),
      ),
    )
    .orderBy(asc(messages.createdAt));

  return NextResponse.json({
    messages: newMsgs.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
