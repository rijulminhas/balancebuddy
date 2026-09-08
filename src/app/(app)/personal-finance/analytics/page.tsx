import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PfAnalytics } from "@/components/personal-finance/analytics/pf-analytics";

export default async function PfAnalyticsPage() {
  if (!(await getSession())) redirect("/login");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Trends and insights across your personal finances.
        </p>
      </div>
      <PfAnalytics />
    </div>
  );
}
