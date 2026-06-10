"use server";

import { db } from "@/db";
import { auditLogs, groupMembers, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

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
  limit = 50
): Promise<ActivityEntry[]> {
  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .limit(1);

  if (!membership) return [];

  const rows = await db
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
    .limit(limit);

  return rows as ActivityEntry[];
}
