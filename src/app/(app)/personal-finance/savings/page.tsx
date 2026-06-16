import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SavingsList } from "@/components/personal-finance/savings/savings-list";

export default async function SavingsPage() {
  if (!(await getSession())) redirect("/login");
  return <SavingsList />;
}
