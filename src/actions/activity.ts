"use server";

import { db } from "@/db";
import { auditLogs, groupMembers, users } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

export interface ActivityEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: Date;
  userName: string | null;
  userId: string | null;
  userImage: string | null;
}

export async function getGroupActivity(
  userId: string,
  limit = 20,
  offset = 0
): Promise<{ entries: ActivityEntry[]; total: number }> {
  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .limit(1);

  if (!membership) return { entries: [], total: 0 };

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        resource: auditLogs.resource,
        resourceId: auditLogs.resourceId,
        before: auditLogs.before,
        after: auditLogs.after,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        userName: users.name,
        userImage: users.image,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.groupId, membership.groupId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ total: count() })
      .from(auditLogs)
      .where(eq(auditLogs.groupId, membership.groupId)),
  ]);

  return { entries: rows as ActivityEntry[], total };
}
