import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  updateReminder,
  deleteReminder,
  toggleReminderActive,
} from "@/actions/reminders";
import { reminderInputSchema } from "@/lib/reminders";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Toggle-only shortcut: { isActive: boolean }
  if (typeof body.isActive === "boolean" && Object.keys(body).length === 1) {
    const result = await toggleReminderActive(session.user.id, id, body.isActive);
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const parsed = reminderInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.issues }, { status: 400 });
  }

  const result = await updateReminder(session.user.id, id, parsed.data);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await deleteReminder(session.user.id, id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
