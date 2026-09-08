import webpush from "web-push";
import type postgres from "postgres";

// Same VAPID key pair as the Next.js app (src/lib/webpush.ts) — subscriptions
// are created against that public key, so the private key used to sign a push
// must match regardless of which server sends it.
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:admin@balancebuddy.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function notifyOfflineMembersOfMessage(
  sql: postgres.Sql,
  params: {
    groupId: string;
    senderId: string;
    senderName: string | null;
    content: string;
    messageType: "text" | "image";
    onlineUserIds: Set<string>;
  }
): Promise<void> {
  const { groupId, senderId, senderName, content, messageType, onlineUserIds } = params;

  const members = await sql`
    SELECT user_id FROM group_members
    WHERE group_id = ${groupId} AND status = 'active' AND user_id != ${senderId}
  `;

  const offlineUserIds = members
    .map((m) => m.user_id as string)
    .filter((id) => !onlineUserIds.has(id));

  if (!offlineUserIds.length) return;

  const title = senderName ?? "New message";
  const body = messageType === "image" ? "Sent an image" : content.slice(0, 140);
  const data = { url: "/chat" };

  for (const userId of offlineUserIds) {
    await sql`
      INSERT INTO notifications (user_id, group_id, type, title, body, data)
      VALUES (${userId}, ${groupId}, 'chat_message', ${title}, ${body}, ${sql.json(data)})
    `;
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;

  const subs = await sql`
    SELECT endpoint, p256dh, auth FROM push_subscriptions
    WHERE user_id IN ${sql(offlineUserIds)}
  `;

  if (!subs.length) return;

  const payload = JSON.stringify({
    title,
    body,
    url: "/chat",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
  });

  await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      )
    )
  );
}
