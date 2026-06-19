import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { sendPushToSubscription, type PushPayload } from "./webpush";

export type NotificationType =
  | "expense_added"
  | "expense_updated"
  | "chore_assigned"
  | "chore_completed"
  | "settlement_requested"
  | "settlement_completed"
  | "payment_confirmation_required"
  | "payment_confirmed"
  | "payment_rejected"
  | "group_invitation"
  | "member_joined"
  | "member_left"
  | "bill_due"
  | "low_stock"
  | "reminder"
  | "general";

export async function notifyUsers(
  userIds: string[],
  groupId: string | null,
  type: NotificationType,
  title: string,
  body: string,
  options?: { data?: Record<string, unknown>; url?: string }
): Promise<void> {
  if (!userIds.length) return;

  const storedData: Record<string, unknown> | null =
    options?.data || options?.url
      ? { ...(options?.data ?? {}), ...(options?.url ? { url: options.url } : {}) }
      : null;

  await db.insert(notifications).values(
    userIds.map((userId) => ({
      userId,
      groupId,
      type,
      title,
      body,
      data: storedData,
    }))
  );

  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(inArray(pushSubscriptions.userId, userIds));

  if (!subs.length) return;

  const pushPayload: PushPayload = {
    title,
    body,
    url: options?.url ?? "/notifications",
  };

  await Promise.allSettled(
    subs.map((sub) =>
      sendPushToSubscription(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        pushPayload
      )
    )
  );
}
