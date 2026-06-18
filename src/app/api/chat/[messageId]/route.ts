import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { messages, groupMembers } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messageId } = await params;

  // Fetch the message and verify it exists and belongs to the caller
  const [msg] = await db
    .select({ senderId: messages.senderId, groupId: messages.groupId, isDeleted: messages.isDeleted })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1);

  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (msg.isDeleted) return NextResponse.json({ error: "Already deleted" }, { status: 410 });
  if (msg.senderId !== session.user.id)
    return NextResponse.json({ error: "Cannot delete another user's message" }, { status: 403 });

  // Confirm the message belongs to a group the user is active in
  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
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

  if (!membership)
    return NextResponse.json({ error: "Not a member of this group" }, { status: 403 });

  const now = new Date();
  await db
    .update(messages)
    .set({ isDeleted: true, deletedAt: now, updatedAt: now })
    .where(eq(messages.id, messageId));

  return NextResponse.json({ success: true });
}
