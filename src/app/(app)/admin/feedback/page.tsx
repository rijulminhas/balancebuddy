import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { desc } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import { FeedbackAdminDashboard } from "@/components/feedback/admin/feedback-admin-dashboard";
import { isSuperAdmin } from "@/lib/super-admin";

export const metadata = { title: "Feedback Management — BalanceBuddy" };

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const session = await getSession();
  if (!session || !isSuperAdmin(session.user.email)) {
    redirect("/dashboard");
  }

  const items = await db.select().from(feedback).orderBy(desc(feedback.createdAt));

  // Compute analytics in-memory (admin only, dataset is manageable)
  const total = items.length;
  const featureRequests = items.filter((f) => f.type === "feature_request").length;
  const bugReports = items.filter((f) => f.type === "bug_report").length;
  const ratings = items.map((f) => f.rating).filter((r): r is number => r !== null);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  const published = items.filter((f) => f.isPublished).length;
  const pending = items.filter((f) => f.status === "NEW").length;

  // Serialize dates for client component
  const serialized = items.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Feedback Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review, publish, and manage all user feedback submissions.
          </p>
        </div>
      </div>

      <FeedbackAdminDashboard
        items={serialized}
        analytics={{ total, featureRequests, bugReports, avgRating, published, pending }}
      />
    </div>
  );
}
