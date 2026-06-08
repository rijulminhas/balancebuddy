import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flatMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [membership] = await db
    .select({ flatId: flatMembers.flatId, role: flatMembers.role })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.userId, session.user.id),
        eq(flatMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return NextResponse.json({ flatId: null, members: [] });

  const members = await db
    .select({
      userId: flatMembers.userId,
      name: users.name,
      role: flatMembers.role,
    })
    .from(flatMembers)
    .innerJoin(users, eq(flatMembers.userId, users.id))
    .where(
      and(eq(flatMembers.flatId, membership.flatId), eq(flatMembers.status, "active"))
    );

  return NextResponse.json({ flatId: membership.flatId, members });
}
