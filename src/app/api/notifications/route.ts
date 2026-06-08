import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  const conditions = unreadOnly
    ? and(
        eq(notifications.userId, session.user.id),
        eq(notifications.isRead, false)
      )
    : eq(notifications.userId, session.user.id);

  const rows = await db
    .select()
    .from(notifications)
    .where(conditions)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return NextResponse.json({ notifications: rows });
}
