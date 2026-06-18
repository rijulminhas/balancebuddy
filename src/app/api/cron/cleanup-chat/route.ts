import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { messages, notifications } from "@/db/schema";
import { and, lt, eq, inArray } from "drizzle-orm";
import { del } from "@vercel/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - TTL_MS);

  // Collect Vercel Blob URLs from expired image messages before deleting rows.
  // GIF messages use external URLs (metadata.isGif = true) and must be skipped.
  const expiredImages = await db
    .select({ content: messages.content, metadata: messages.metadata })
    .from(messages)
    .where(and(lt(messages.createdAt, cutoff), eq(messages.type, "image")));

  const blobUrls = expiredImages
    .filter((m) => !(m.metadata as { isGif?: boolean } | null)?.isGif)
    .map((m) => m.content);

  // Hard-delete user chat messages (text + image) older than 24 h.
  // System/activity messages (system, expense_update, etc.) are permanent records and are not touched.
  const deletedMsgs = await db
    .delete(messages)
    .where(
      and(
        lt(messages.createdAt, cutoff),
        inArray(messages.type, ["text", "image"]),
      ),
    )
    .returning({ id: messages.id });

  // Remove orphaned Vercel Blob files. Log failures but don't abort — DB cleanup already succeeded.
  if (blobUrls.length > 0) {
    try {
      await del(blobUrls);
    } catch (err) {
      console.error("[cleanup-chat] blob deletion failed, storage may have orphaned files:", err);
    }
  }

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
    blobsDeleted: blobUrls.length,
    notificationsDeleted: deletedNotifs.length,
  });
}
