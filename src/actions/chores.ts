"use server";

import { db } from "@/db";
import { chores, flatMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { notifyUsers } from "@/lib/notify";
import type { ActionResult } from "./auth";

const choreSchema = z.object({
  flatId: z.string().uuid(),
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

  const { flatId, assignedToId, dueDate, ...rest } = parsed.data;

  const [membership] = await db
    .select({ id: flatMembers.id })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.flatId, flatId),
        eq(flatMembers.userId, userId),
        eq(flatMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "Not a member of this flat" };

  const [chore] = await db
    .insert(chores)
    .values({
      flatId,
      createdById: userId,
      assignedToId: assignedToId ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      ...rest,
    })
    .returning({ id: chores.id });

  // Notify the assigned user (if different from creator)
  if (assignedToId && assignedToId !== userId) {
    const [creator] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await notifyUsers(
      [assignedToId],
      flatId,
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

export async function updateChoreStatus(
  userId: string,
  choreId: string,
  status: "pending" | "in_progress" | "completed" | "skipped"
): Promise<ActionResult> {
  const [chore] = await db
    .select({ id: chores.id, flatId: chores.flatId, title: chores.title })
    .from(chores)
    .where(eq(chores.id, choreId))
    .limit(1);

  if (!chore) return { success: false, error: "Chore not found" };

  const [membership] = await db
    .select({ id: flatMembers.id })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.flatId, chore.flatId),
        eq(flatMembers.userId, userId),
        eq(flatMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "Not authorized" };

  await db
    .update(chores)
    .set({
      status,
      updatedAt: new Date(),
      ...(status === "completed"
        ? { completedAt: new Date(), completedById: userId }
        : {}),
    })
    .where(eq(chores.id, choreId));

  // Notify flat members when a chore is completed
  if (status === "completed") {
    const [completer] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const allMembers = await db
      .select({ userId: flatMembers.userId })
      .from(flatMembers)
      .where(
        and(
          eq(flatMembers.flatId, chore.flatId),
          eq(flatMembers.status, "active")
        )
      );

    const otherMemberIds = allMembers
      .map((m) => m.userId)
      .filter((id) => id !== userId);

    if (otherMemberIds.length > 0) {
      await notifyUsers(
        otherMemberIds,
        chore.flatId,
        "chore_completed",
        "Chore completed",
        `${completer?.name ?? "Someone"} completed: ${chore.title}`,
        { url: "/chores" }
      );
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
    .select({ id: chores.id, createdById: chores.createdById })
    .from(chores)
    .where(eq(chores.id, choreId))
    .limit(1);

  if (!chore) return { success: false, error: "Chore not found" };
  if (chore.createdById !== userId)
    return { success: false, error: "Only the creator can delete this chore" };

  await db.delete(chores).where(eq(chores.id, choreId));

  revalidatePath("/chores");
  revalidatePath("/dashboard");

  return { success: true };
}
