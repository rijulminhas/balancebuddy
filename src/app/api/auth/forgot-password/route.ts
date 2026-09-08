import { NextRequest, NextResponse } from "next/server";
import { requestPasswordReset } from "@/actions/auth";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    await requestPasswordReset(parsed.data.email);

    // Always 200 to prevent user enumeration
    return NextResponse.json({ message: "Reset email sent if account exists" });
  } catch (err) {
    console.error("[POST /api/auth/forgot-password]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
