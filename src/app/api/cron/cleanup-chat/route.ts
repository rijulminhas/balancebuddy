import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, notifications } from "@/db/schema";
import { and, lt, eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - TTL_MS);

  // Hard-delete all chat messages older than 24 h (both text and image)
  const deletedMsgs = await db
    .delete(messages)
    .where(lt(messages.createdAt, cutoff))
    .returning({ id: messages.id });

  // Hard-delete chat notifications (type "general") older than 24 h
  const deletedNotifs = await db
    .delete(notifications)
    .where(
      and(
        lt(notifications.createdAt, cutoff),
        eq(notifications.type, "general"),
      ),
    )
    .returning({ id: notifications.id });

  return NextResponse.json({
    cutoff: cutoff.toISOString(),
    messagesDeleted: deletedMsgs.length,
    notificationsDeleted: deletedNotifs.length,
  });
}
