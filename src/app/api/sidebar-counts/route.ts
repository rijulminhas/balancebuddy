import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { notifications, groupHistory } from "@/db/schema";
import { eq, and, isNull, count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ unread: 0, history: 0, unreadChat: 0 });

  const userId = session.user.id;

  const [notifRow, historyRow, chatRow] = await Promise.all([
    db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
    db
      .select({ count: count() })
      .from(groupHistory)
      .where(and(eq(groupHistory.userId, userId), isNull(groupHistory.deletedAt))),
    db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false),
          sql`${notifications.data}->>'url' = '/chat'`,
        ),
      ),
  ]);

  return NextResponse.json(
    {
      unread: notifRow[0]?.count ?? 0,
      history: historyRow[0]?.count ?? 0,
      unreadChat: chatRow[0]?.count ?? 0,
    },
    { headers: { "Cache-Control": "private, max-age=30" } },
  );
}
