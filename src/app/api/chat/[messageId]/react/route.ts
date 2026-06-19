import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { messages, groupMembers, messageReactions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

const reactSchema = z.object({
  emoji: z.string().min(1).max(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;

  const body: unknown = await req.json();
  const parsed = reactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }
  const { emoji } = parsed.data;

  // Verify message exists and caller is an active group member
  const [msg] = await db
    .select({ groupId: messages.groupId, isDeleted: messages.isDeleted })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg || msg.isDeleted) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const [membership] = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.groupId, msg.groupId),
        eq(groupMembers.status, "active"),
      ),
    )
    .orderBy(desc(groupMembers.joinedAt))
    .limit(1);

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  // Toggle: delete if exists, insert if not
  const [existing] = await db
    .select({ id: messageReactions.id })
    .from(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, session.user.id),
        eq(messageReactions.emoji, emoji),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .delete(messageReactions)
      .where(eq(messageReactions.id, existing.id));
  } else {
    await db.insert(messageReactions).values({
      messageId,
      userId: session.user.id,
      emoji,
    });
  }

  // Bump messages.updatedAt so the poll detects this change for other clients
  await db
    .update(messages)
    .set({ updatedAt: new Date() })
    .where(eq(messages.id, messageId));

  return NextResponse.json({ toggled: existing ? "removed" : "added", emoji });
}
