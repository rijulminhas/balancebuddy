"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { ActionResult } from "./auth";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  image: z.string().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function updateProfile(input: {
  name: string;
  image?: string;
}): Promise<ActionResult<{ name: string; image: string | null }>> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { name, image } = parsed.data;

  const [updated] = await db
    .update(users)
    .set({
      name,
      image: image || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))
    .returning({ name: users.name, image: users.image });

  return { success: true, data: updated };
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  if (!session) return { success: false, error: "Unauthorized" };

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { currentPassword, newPassword } = parsed.data;

  const [user] = await db
    .select({ password: users.password })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user?.password) {
    return { success: false, error: "Cannot change password for this account" };
  }

  const passwordMatch = await bcrypt.compare(currentPassword, user.password);
  if (!passwordMatch) {
    return { success: false, error: "Current password is incorrect" };
  }

  if (currentPassword === newPassword) {
    return { success: false, error: "New password must be different from current password" };
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await db
    .update(users)
    .set({ password: hashed, updatedAt: new Date() })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
