import { db } from "@/db";
import { notifications, pushSubscriptions } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { sendPushToSubscription, type PushPayload } from "./webpush";

type NotificationType =
  | "expense_added"
  | "expense_updated"
  | "chore_assigned"
  | "chore_completed"
  | "settlement_requested"
  | "settlement_completed"
  | "group_invitation"
  | "member_joined"
  | "member_left"
  | "bill_due"
  | "low_stock"
  | "general";

export async function notifyUsers(
  userIds: string[],
  groupId: string,
  type: NotificationType,
  title: string,
  body: string,
  options?: { data?: Record<string, unknown>; url?: string }
): Promise<void> {
  if (!userIds.length) return;

  await db.insert(notifications).values(
    userIds.map((userId) => ({
      userId,
      groupId,
      type,
      title,
      body,
      data: (options?.data ?? null) as Record<string, unknown> | null,
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
