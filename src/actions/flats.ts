"use server";

import { db } from "@/db";
import { flats, flatMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/mailer";
import type { ActionResult } from "./auth";

const createFlatSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(500).optional(),
  address: z.string().max(500).optional(),
});

const joinFlatSchema = z.object({
  inviteCode: z.string().min(1).max(20),
});

export async function createFlat(
  userId: string,
  input: { name: string; description?: string; address?: string }
): Promise<ActionResult<{ flatId: string }>> {
  const parsed = createFlatSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { name, description, address } = parsed.data;

  // Check if user is already in an active flat
  const [existing] = await db
    .select({ id: flatMembers.id })
    .from(flatMembers)
    .where(and(eq(flatMembers.userId, userId), eq(flatMembers.status, "active")))
    .limit(1);

  if (existing) {
    return { success: false, error: "You are already a member of a flat" };
  }

  const inviteCode = randomBytes(4).toString("hex").toUpperCase();

  const [flat] = await db
    .insert(flats)
    .values({ name, description, address, inviteCode, ownerId: userId })
    .returning({ id: flats.id });

  await db.insert(flatMembers).values({
    flatId: flat.id,
    userId,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  });

  revalidatePath("/dashboard");
  revalidatePath("/flats");

  return { success: true, data: { flatId: flat.id } };
}

export async function joinFlat(
  userId: string,
  input: { inviteCode: string }
): Promise<ActionResult<{ flatId: string }>> {
  const parsed = joinFlatSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid invite code" };

  const { inviteCode } = parsed.data;

  const [flat] = await db
    .select({ id: flats.id, name: flats.name })
    .from(flats)
    .where(eq(flats.inviteCode, inviteCode.toUpperCase()))
    .limit(1);

  if (!flat) return { success: false, error: "Invalid invite code" };

  // Check user is not already a member
  const [existing] = await db
    .select({ id: flatMembers.id, status: flatMembers.status })
    .from(flatMembers)
    .where(and(eq(flatMembers.flatId, flat.id), eq(flatMembers.userId, userId)))
    .limit(1);

  if (existing?.status === "active") {
    return { success: false, error: "You are already a member of this flat" };
  }

  // Check user isn't in another flat
  const [otherFlat] = await db
    .select({ id: flatMembers.id })
    .from(flatMembers)
    .where(and(eq(flatMembers.userId, userId), eq(flatMembers.status, "active")))
    .limit(1);

  if (otherFlat) {
    return { success: false, error: "You are already a member of another flat" };
  }

  if (existing) {
    // Re-activate a removed/left member
    await db
      .update(flatMembers)
      .set({ status: "active", joinedAt: new Date(), updatedAt: new Date() })
      .where(eq(flatMembers.id, existing.id));
  } else {
    await db.insert(flatMembers).values({
      flatId: flat.id,
      userId,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/flats");

  return { success: true, data: { flatId: flat.id } };
}

export async function sendFlatInvite(
  flatId: string,
  toEmail: string
): Promise<ActionResult> {
  const emailSchema = z.string().email();
  if (!emailSchema.safeParse(toEmail).success) {
    return { success: false, error: "Invalid email address" };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };

  const [membership] = await db
    .select({ id: flatMembers.id })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.flatId, flatId),
        eq(flatMembers.userId, session.user.id),
        eq(flatMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) return { success: false, error: "You are not a member of this flat" };

  const [flat] = await db
    .select({ name: flats.name, inviteCode: flats.inviteCode })
    .from(flats)
    .where(eq(flats.id, flatId))
    .limit(1);

  if (!flat) return { success: false, error: "Flat not found" };

  const [sender] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${flat.inviteCode}`;

  await sendInviteEmail(toEmail, flat.name, inviteUrl, sender?.name ?? "Your flatmate");

  return { success: true };
}

export async function leaveFlat(
  userId: string,
  flatId: string
): Promise<ActionResult> {
  const [member] = await db
    .select({ id: flatMembers.id, role: flatMembers.role })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.flatId, flatId),
        eq(flatMembers.userId, userId),
        eq(flatMembers.status, "active")
      )
    )
    .limit(1);

  if (!member) return { success: false, error: "You are not a member of this flat" };
  if (member.role === "owner") {
    return { success: false, error: "Owner cannot leave the flat. Transfer ownership first." };
  }

  await db
    .update(flatMembers)
    .set({ status: "left", updatedAt: new Date() })
    .where(eq(flatMembers.id, member.id));

  revalidatePath("/dashboard");
  revalidatePath("/flats");

  return { success: true };
}
