import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!ALLOWED.includes(file.type))
    return NextResponse.json({ error: "Only JPEG, PNG, WebP and GIF allowed" }, { status: 400 });
  if (file.size > MAX_SIZE)
    return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${randomBytes(12).toString("hex")}.${ext}`;
  const dir = join(process.cwd(), "public", "uploads", "receipts");

  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return NextResponse.json({ url: `/uploads/receipts/${filename}` });
}
