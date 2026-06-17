"use server";

import { db } from "@/db";
import { feedback } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/session";
import type { ActionResult } from "./auth";
import { isSuperAdmin } from "@/lib/super-admin";

const FEEDBACK_TYPES = [
  "feedback",
  "feature_request",
  "bug_report",
  "general_suggestion",
] as const;

const feedbackSubmitSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(255, "Title must be under 255 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be under 5000 characters"),
});

export type FeedbackInput = z.input<typeof feedbackSubmitSchema>;

export async function submitFeedback(input: FeedbackInput): Promise<ActionResult<{ id: string }>> {
  const session = await getSession();
  if (!session) return { success: false, error: "Not authenticated" };

  const parsed = feedbackSubmitSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Spam guard: one submission per hour per user
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [recent] = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(and(eq(feedback.userId, session.user.id), gt(feedback.createdAt, oneHourAgo)))
    .limit(1);

  if (recent) {
    return { success: false, error: "You can submit feedback once per hour. Please wait before submitting again." };
  }

  const { type, rating, title, description } = parsed.data;

  const [created] = await db
    .insert(feedback)
    .values({
      userId: session.user.id,
      userName: session.user.name ?? "Anonymous",
      userEmail: session.user.email ?? "",
      type,
      rating: rating ?? null,
      title: title.trim(),
      description: description.trim(),
      status: "NEW",
      isPublished: false,
      allowPublicDisplay: true,
    })
    .returning({ id: feedback.id });

  revalidatePath("/admin/feedback");
  return { success: true, data: { id: created.id } };
}

type FeedbackStatus = "NEW" | "REVIEWED" | "PUBLISHED" | "ARCHIVED";

export async function updateFeedbackStatus(
  feedbackId: string,
  action: "review" | "publish" | "unpublish" | "archive"
): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.user.email)) {
    return { success: false, error: "Unauthorized" };
  }

  const now = new Date();
  let setValues: { status: FeedbackStatus; isPublished: boolean; updatedAt: Date };

  switch (action) {
    case "review":
      setValues = { status: "REVIEWED", isPublished: false, updatedAt: now };
      break;
    case "publish":
      setValues = { status: "PUBLISHED", isPublished: true, updatedAt: now };
      break;
    case "unpublish":
      setValues = { status: "REVIEWED", isPublished: false, updatedAt: now };
      break;
    case "archive":
      setValues = { status: "ARCHIVED", isPublished: false, updatedAt: now };
      break;
  }

  await db.update(feedback).set(setValues).where(eq(feedback.id, feedbackId));

  revalidatePath("/admin/feedback");
  revalidatePath("/");
  return { success: true };
}

export async function deleteFeedback(feedbackId: string): Promise<ActionResult> {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.user.email)) {
    return { success: false, error: "Unauthorized" };
  }

  await db.delete(feedback).where(eq(feedback.id, feedbackId));

  revalidatePath("/admin/feedback");
  revalidatePath("/");
  return { success: true };
}
