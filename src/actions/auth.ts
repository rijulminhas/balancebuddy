"use server";

import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomBytes } from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/mailer";

const registerSchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8),
});

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<ActionResult<{ userId: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid input" };
  }

  const { name, email, password } = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { success: false, error: "An account with this email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({ name, email, password: hashedPassword })
    .returning({ id: users.id });

  // Create email verification token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await db.insert(verificationTokens).values({
    userId: user.id,
    token,
    type: "email_verification",
    expiresAt,
  });

  await sendVerificationEmail(email, token);

  return { success: true, data: { userId: user.id } };
}

export async function requestPasswordReset(
  email: string
): Promise<ActionResult> {
  const [user] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Always return success to prevent user enumeration
  if (!user) return { success: true };

  // Delete any existing password reset tokens for this user
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.userId, user.id));

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await db.insert(verificationTokens).values({
    userId: user.id,
    token: otp,
    type: "password_reset",
    expiresAt,
  });

  await sendPasswordResetEmail(user.email, otp);

  return { success: true };
}

export async function resetPasswordWithOtp(
  email: string,
  otp: string,
  newPassword: string
): Promise<ActionResult> {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) return { success: false, error: "Invalid OTP" };

  const [record] = await db
    .select()
    .from(verificationTokens)
    .where(eq(verificationTokens.userId, user.id))
    .limit(1);

  if (
    !record ||
    record.type !== "password_reset" ||
    record.token !== otp ||
    record.expiresAt < new Date()
  ) {
    return { success: false, error: "Invalid or expired OTP" };
  }

  const hashed = await bcrypt.hash(newPassword, 12);

  await db.update(users).set({ password: hashed }).where(eq(users.id, user.id));
  await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));

  return { success: true };
}
