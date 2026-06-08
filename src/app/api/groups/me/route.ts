import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ groupId: groupMembers.groupId, role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return NextResponse.json({ groupId: null, members: [] });

  const members = await db
    .select({
      userId: groupMembers.userId,
      name: users.name,
      role: groupMembers.role,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(
      and(eq(groupMembers.groupId, membership.groupId), eq(groupMembers.status, "active"))
    );

  return NextResponse.json({ groupId: membership.groupId, members });
}
