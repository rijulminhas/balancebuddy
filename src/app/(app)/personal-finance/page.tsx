import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PfDashboard } from "@/components/personal-finance/dashboard/pf-dashboard";

export default async function PersonalFinancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <PfDashboard userId={session.user.id} />;
}
