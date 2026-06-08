import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupHistory } from "@/db/schema";
import { eq, and, isNull, count } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ count: 0 });

  const [result] = await db
    .select({ count: count() })
    .from(groupHistory)
    .where(and(eq(groupHistory.userId, session.user.id), isNull(groupHistory.deletedAt)));

  return NextResponse.json({ count: result?.count ?? 0 });
}
