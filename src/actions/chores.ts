"use server";

import { db } from "@/db";
import { chores, groupMembers, users, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notify";
import type { ActionResult } from "./auth";

const choreSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(500).optional(),
  assignedToId: z.string().uuid().optional(),
  frequency: z
    .enum(["once", "daily", "weekly", "biweekly", "monthly"])
    .default("once"),
  dueDate: z.string().datetime().optional(),
  points: z.number().int().min(0).max(100).default(0),
  isRecurring: z.boolean().default(false),
});

export async function createChore(
  userId: string,
  input: z.infer<typeof choreSchema>
): Promise<ActionResult<{ choreId: string }>> {
  const parsed = choreSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { groupId, assignedToId, dueDate, ...rest } = parsed.data;

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "Not a member of this group" };

  const [chore] = await db
    .insert(chores)
    .values({
      groupId,
      createdById: userId,
      assignedToId: assignedToId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      ...rest,
    })
    .returning({ id: chores.id });

  await db.insert(auditLogs).values({
    groupId,
    userId,
    action: "chore.created",
    resource: "chore",
    resourceId: chore.id,
    after: { title: rest.title },
  });

  if (assignedToId && assignedToId !== userId) {
    const [creator] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await notifyUsers(
      [assignedToId],
      groupId,
      "chore_assigned",
      "Chore assigned to you",
      `${creator?.name ?? "Someone"} assigned you: ${rest.title}`,
      { url: "/chores" }
    );
  }

  revalidatePath("/chores");
  revalidatePath("/dashboard");

  return { success: true, data: { choreId: chore.id } };
}

function computeNextDueDate(frequency: string, from: Date): Date {
  const next = new Date(from);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }
  return next;
}

export async function updateChoreStatus(
  userId: string,
  choreId: string,
  status: "pending" | "in_progress" | "completed" | "skipped"
): Promise<ActionResult> {
  const [chore] = await db
    .select({
      id: chores.id,
      groupId: chores.groupId,
      title: chores.title,
      description: chores.description,
      assignedToId: chores.assignedToId,
      createdById: chores.createdById,
      frequency: chores.frequency,
      dueDate: chores.dueDate,
      points: chores.points,
      isRecurring: chores.isRecurring,
    })
    .from(chores)
    .where(eq(chores.id, choreId))
    .limit(1);

  if (!chore) return { success: false, error: "Chore not found" };

  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, chore.groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "Not authorized" };

  const now = new Date();

  await db
    .update(chores)
    .set({
      status,
      updatedAt: now,
      ...(status === "completed"
        ? { completedAt: now, completedById: userId }
        : {}),
    })
    .where(eq(chores.id, choreId));

  await db.insert(auditLogs).values({
    groupId: chore.groupId,
    userId,
    action: status === "completed" ? "chore.completed" : "chore.updated",
    resource: "chore",
    resourceId: choreId,
    after: { title: chore.title, status },
  });

  if (status === "completed") {
    const [completer] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const allMembers = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, chore.groupId),
          eq(groupMembers.status, "active")
        )
      );

    const otherMemberIds = allMembers
      .map((m) => m.userId)
      .filter((id) => id !== userId);

    if (otherMemberIds.length > 0) {
      await notifyUsers(
        otherMemberIds,
        chore.groupId,
        "chore_completed",
        "Chore completed",
        `${completer?.name ?? "Someone"} completed: ${chore.title}`,
        { url: "/chores" }
      );
    }

    // Spawn next occurrence for recurring chores
    if (chore.isRecurring && chore.frequency !== "once") {
      const base = chore.dueDate ?? now;
      const nextDueDate = computeNextDueDate(chore.frequency, base);

      const [newChore] = await db
        .insert(chores)
        .values({
          groupId: chore.groupId,
          createdById: chore.createdById,
          assignedToId: chore.assignedToId,
          title: chore.title,
          description: chore.description,
          frequency: chore.frequency,
          dueDate: nextDueDate,
          points: chore.points,
          isRecurring: true,
          status: "pending",
        })
        .returning({ id: chores.id });

      await db.insert(auditLogs).values({
        groupId: chore.groupId,
        userId,
        action: "chore.created",
        resource: "chore",
        resourceId: newChore.id,
        after: { title: chore.title, spawnedFrom: choreId },
      });
    }
  }

  revalidatePath("/chores");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function deleteChore(
  userId: string,
  choreId: string
): Promise<ActionResult> {
  const [chore] = await db
    .select({ id: chores.id, createdById: chores.createdById, groupId: chores.groupId })
    .from(chores)
    .where(eq(chores.id, choreId))
    .limit(1);

  if (!chore) return { success: false, error: "Chore not found" };
  if (chore.createdById !== userId)
    return { success: false, error: "Only the creator can delete this chore" };

  await db.insert(auditLogs).values({
    groupId: chore.groupId,
    userId,
    action: "chore.deleted",
    resource: "chore",
    resourceId: choreId,
    after: null,
  });

  await db.delete(chores).where(eq(chores.id, choreId));

  revalidatePath("/chores");
  revalidatePath("/dashboard");

  return { success: true };
}
