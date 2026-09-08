"use server";

import { getSession } from "@/lib/session";
import { db } from "@/db";
import { groupMembers } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import jwt from "jsonwebtoken";

export async function getWsToken(groupId?: string): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  // If groupId not supplied, fall back to the user's most-recently-joined group
  let resolvedGroupId = groupId;
  if (!resolvedGroupId) {
    const [membership] = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, session.user.id), eq(groupMembers.status, "active")))
      .orderBy(desc(groupMembers.joinedAt))
      .limit(1);
    if (!membership) return null;
    resolvedGroupId = membership.groupId;
  } else {
    // Verify the user is actually an active member of the requested group
    const [membership] = await db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.userId, session.user.id),
          eq(groupMembers.groupId, resolvedGroupId),
          eq(groupMembers.status, "active"),
        ),
      )
      .limit(1);
    if (!membership) return null;
  }

  return jwt.sign(
    {
      sub: session.user.id,
      name: session.user.name ?? null,
      picture: session.user.image ?? null,
      groupId: resolvedGroupId,
    },
    process.env.NEXTAUTH_SECRET!,
    { expiresIn: "1h" },
  );
}
