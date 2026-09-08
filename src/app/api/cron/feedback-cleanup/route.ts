import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { and, eq, lt } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Delete only ARCHIVED records older than 30 days that are NOT published
  const deleted = await db
    .delete(feedback)
    .where(
      and(
        eq(feedback.status, "ARCHIVED"),
        eq(feedback.isPublished, false),
        lt(feedback.createdAt, thirtyDaysAgo)
      )
    )
    .returning({ id: feedback.id });

  return NextResponse.json({ deleted: deleted.length });
}
