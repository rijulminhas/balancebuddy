import { NextResponse } from "next/server";
import { getSettlementsAwaitingReminderSend } from "@/actions/settlements";
import { notifyUsers } from "@/lib/notify";

/**
 * POST /api/settlements/remind
 *
 * Called by a Vercel Cron Job (set cron: "0 * * * *" in vercel.json).
 * Finds settlements that have been awaiting_confirmation for >24 hours
 * and sends a reminder push notification to the receiver.
 *
 * Secure with CRON_SECRET env variable.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const pending = await getSettlementsAwaitingReminderSend();

  if (pending.length === 0) {
    return NextResponse.json({ reminded: 0 });
  }

  // Group by receiver (toUserId) to batch into one notification per user
  const byReceiver = new Map<
    string,
    { groupId: string; count: number; totalAmount: number }
  >();

  for (const s of pending) {
    const existing = byReceiver.get(s.toUserId);
    if (existing) {
      existing.count += 1;
      existing.totalAmount += Number(s.amount);
    } else {
      byReceiver.set(s.toUserId, {
        groupId: s.groupId,
        count: 1,
        totalAmount: Number(s.amount),
      });
    }
  }

  const notifyPromises = Array.from(byReceiver.entries()).map(
    ([toUserId, { groupId, count, totalAmount }]) =>
      notifyUsers(
        [toUserId],
        groupId,
        "payment_confirmation_required",
        "Reminder: Payment Confirmation Required",
        count === 1
          ? `You have a payment of ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} awaiting your confirmation.`
          : `You have ${count} payments totalling ₹${totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} awaiting your confirmation.`,
        { url: "/settlements" }
      )
  );

  await Promise.allSettled(notifyPromises);

  return NextResponse.json({ reminded: pending.length });
}
