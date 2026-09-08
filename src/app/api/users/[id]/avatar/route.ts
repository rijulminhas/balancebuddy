import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [user] = await db
    .select({ image: users.image })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user?.image) {
    return new NextResponse(null, { status: 404 });
  }

  // External URL → redirect
  if (!user.image.startsWith("data:")) {
    return NextResponse.redirect(user.image);
  }

  // base64 data URI → parse and stream as binary
  const commaIndex = user.image.indexOf(",");
  if (commaIndex === -1) {
    return new NextResponse(null, { status: 400 });
  }

  const header = user.image.slice(0, commaIndex);
  const data = user.image.slice(commaIndex + 1);
  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch?.[1] ?? "image/png";

  const buffer = Buffer.from(data, "base64");

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
