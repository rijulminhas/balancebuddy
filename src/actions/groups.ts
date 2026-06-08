"use server";

import { db } from "@/db";
import { groups, groupMembers, groupHistory, users } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/mailer";
import { notifyUsers } from "@/lib/notify";
import type { ActionResult } from "./auth";

const createGroupSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
});

const joinGroupSchema = z.object({
  inviteCode: z.string().min(1).max(20),
});

export async function createGroup(
  userId: string,
  input: { name: string; description?: string; address?: string }
): Promise<ActionResult<{ groupId: string }>> {
  const parsed = createGroupSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { name, description, address } = parsed.data;

  const [existing] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .limit(1);

  if (existing) {
    return { success: false, error: "You are already a member of a group" };
  }

  const inviteCode = randomBytes(4).toString("hex").toUpperCase();

  const [group] = await db
    .insert(groups)
    .values({ name, description, address, inviteCode, ownerId: userId })
    .returning({ id: groups.id });

  await db.insert(groupMembers).values({
    groupId: group.id,
    userId,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/groups");

  return { success: true, data: { groupId: group.id } };
}

// Backward-compat alias
export const createFlat = createGroup;

export async function joinGroup(
  userId: string,
  input: { inviteCode: string }
): Promise<ActionResult<{ groupId: string }>> {
  const parsed = joinGroupSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid invite code" };

  const { inviteCode } = parsed.data;

  const [group] = await db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(eq(groups.inviteCode, inviteCode.toUpperCase()))
    .limit(1);

  if (!group) return { success: false, error: "Invalid invite code" };

  const [existing] = await db
    .select({ id: groupMembers.id, status: groupMembers.status })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId)))
    .limit(1);

  if (existing?.status === "active") {
    return { success: false, error: "You are already a member of this group" };
  }

  const [otherGroup] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .limit(1);

  if (otherGroup) {
    return { success: false, error: "You are already a member of another group" };
  }

  if (existing) {
    await db
      .update(groupMembers)
      .set({ status: "active", joinedAt: new Date(), updatedAt: new Date() })
      .where(eq(groupMembers.id, existing.id));
  } else {
    await db.insert(groupMembers).values({
      groupId: group.id,
      userId,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    });
  }

  const activeMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, group.id), eq(groupMembers.status, "active"))
    );

  const [joiningUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const notifyIds = activeMembers.map((m) => m.userId).filter((id) => id !== userId);
  if (notifyIds.length > 0) {
    await notifyUsers(
      notifyIds,
      group.id,
      "member_joined",
      `${joiningUser?.name ?? "Someone"} joined the group`,
      `${joiningUser?.name ?? "A new member"} has joined ${group.name}.`,
      { url: "/groups" }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");

  return { success: true, data: { groupId: group.id } };
}

// Backward-compat alias
export const joinFlat = joinGroup;

export async function sendGroupInvite(
  groupId: string,
  toEmail: string
): Promise<ActionResult> {
  const emailSchema = z.string().email();
  if (!emailSchema.safeParse(toEmail).success) {
    return { success: false, error: "Invalid email address" };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "You are not a member of this group" };

  const [group] = await db
    .select({ name: groups.name, inviteCode: groups.inviteCode })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  if (!group) return { success: false, error: "Group not found" };

  const [sender] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${group.inviteCode}`;

  await sendInviteEmail(toEmail, group.name, inviteUrl, sender?.name ?? "Your groupmate");

  return { success: true };
}

// Backward-compat alias
export const sendFlatInvite = sendGroupInvite;

export async function leaveGroup(
  userId: string,
  groupId: string
): Promise<ActionResult> {
  const [member] = await db
    .select({ id: groupMembers.id, role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!member) return { success: false, error: "You are not a member of this group" };
  if (member.role === "owner") {
    return {
      success: false,
      error: "Owner cannot leave the group. Transfer ownership first.",
    };
  }

  const [groupData] = await db
    .select({ name: groups.name, address: groups.address, inviteCode: groups.inviteCode })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  await db
    .update(groupMembers)
    .set({ status: "left", updatedAt: new Date() })
    .where(eq(groupMembers.id, member.id));

  await db.insert(groupHistory).values({
    userId,
    groupId,
    groupName: groupData.name,
    groupAddress: groupData.address,
    role: member.role,
    leftAt: new Date(),
    inviteCode: groupData.inviteCode,
  });

  const [leavingUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const remainingMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));

  const remainingUserIds = remainingMembers.map((m) => m.userId);
  if (remainingUserIds.length > 0) {
    await notifyUsers(
      remainingUserIds,
      groupId,
      "member_left",
      `${leavingUser?.name ?? "A member"} left the group`,
      `${leavingUser?.name ?? "A member"} has left the group.`,
      { url: "/groups" }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");

  return { success: true };
}

// Backward-compat alias
export const leaveFlat = leaveGroup;

export async function transferOwnershipAndLeave(
  requesterId: string,
  groupId: string,
  newOwnerId: string
): Promise<ActionResult> {
  if (requesterId === newOwnerId) {
    return { success: false, error: "Cannot transfer ownership to yourself" };
  }

  const [requesterMember] = await db
    .select({ id: groupMembers.id, role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, requesterId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!requesterMember || requesterMember.role !== "owner") {
    return { success: false, error: "Only the group owner can transfer ownership" };
  }

  const [newOwnerMember] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, newOwnerId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!newOwnerMember) {
    return { success: false, error: "Selected member is not an active member of this group" };
  }

  const [[requesterUser], [newOwnerUser]] = await Promise.all([
    db.select({ name: users.name }).from(users).where(eq(users.id, requesterId)).limit(1),
    db.select({ name: users.name }).from(users).where(eq(users.id, newOwnerId)).limit(1),
  ]);

  await db
    .update(groups)
    .set({ ownerId: newOwnerId, updatedAt: new Date() })
    .where(eq(groups.id, groupId));

  await db
    .update(groupMembers)
    .set({ role: "owner", updatedAt: new Date() })
    .where(eq(groupMembers.id, newOwnerMember.id));

  await db
    .update(groupMembers)
    .set({ status: "left", role: "member", updatedAt: new Date() })
    .where(eq(groupMembers.id, requesterMember.id));

  const [groupData] = await db
    .select({ name: groups.name, address: groups.address, inviteCode: groups.inviteCode })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);

  await db.insert(groupHistory).values({
    userId: requesterId,
    groupId,
    groupName: groupData.name,
    groupAddress: groupData.address,
    role: "owner",
    leftAt: new Date(),
    inviteCode: groupData.inviteCode,
  });

  const remainingMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));

  const remainingUserIds = remainingMembers.map((m) => m.userId);
  if (remainingUserIds.length > 0) {
    await notifyUsers(
      remainingUserIds,
      groupId,
      "member_left",
      "Ownership transferred",
      `${requesterUser?.name ?? "The owner"} transferred ownership to ${newOwnerUser?.name ?? "another member"} and left the group.`,
      { url: "/groups" }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");

  return { success: true };
}

export async function removeMember(
  requesterId: string,
  groupId: string,
  targetUserId: string,
  reason: string
): Promise<ActionResult> {
  if (requesterId === targetUserId) {
    return { success: false, error: "You cannot remove yourself" };
  }

  const [requesterMember] = await db
    .select({ id: groupMembers.id, role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, requesterId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!requesterMember || requesterMember.role !== "owner") {
    return { success: false, error: "Only the group owner can remove members" };
  }

  const [targetMember] = await db
    .select({ id: groupMembers.id, role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, targetUserId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!targetMember) {
    return { success: false, error: "Member not found in this group" };
  }

  if (targetMember.role === "owner") {
    return { success: false, error: "Cannot remove the group owner" };
  }

  const trimmedReason = reason.trim() || "Left the group";

  await db
    .update(groupMembers)
    .set({ status: "removed", removedReason: trimmedReason, updatedAt: new Date() })
    .where(eq(groupMembers.id, targetMember.id));

  const [targetUser] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  const activeMembers = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "active")));

  const notifyIds = [...new Set([...activeMembers.map((m) => m.userId), targetUserId])];
  if (notifyIds.length > 0) {
    await notifyUsers(
      notifyIds,
      groupId,
      "member_left",
      `${targetUser?.name ?? "A member"} was removed from the group`,
      `${targetUser?.name ?? "A member"} has been removed. Reason: ${trimmedReason}`,
      { url: "/groups" }
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");

  return { success: true };
}

export async function getGroupHistory(
  userId: string
): Promise<ActionResult<typeof groupHistory.$inferSelect[]>> {
  const history = await db
    .select()
    .from(groupHistory)
    .where(and(eq(groupHistory.userId, userId), isNull(groupHistory.deletedAt)))
    .orderBy(desc(groupHistory.leftAt));
  return { success: true, data: history };
}

// Backward-compat alias
export const getFlatHistory = getGroupHistory;

export async function deleteFromHistory(
  historyId: string
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  const userId = session.user.id;

  const [entry] = await db
    .select({ id: groupHistory.id, groupId: groupHistory.groupId })
    .from(groupHistory)
    .where(and(eq(groupHistory.id, historyId), eq(groupHistory.userId, userId)))
    .limit(1);

  if (!entry) return { success: false, error: "History entry not found" };

  const [group] = await db
    .select({ ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.id, entry.groupId))
    .limit(1);

  if (group?.ownerId === userId) {
    await db
      .update(groups)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(groups.id, entry.groupId));

    await db
      .update(groupHistory)
      .set({ deletedAt: new Date(), deletedByOwner: true })
      .where(eq(groupHistory.groupId, entry.groupId));
  } else {
    await db
      .update(groupHistory)
      .set({ deletedAt: new Date() })
      .where(eq(groupHistory.id, historyId));
  }

  revalidatePath("/groups/history");
  return { success: true };
}
