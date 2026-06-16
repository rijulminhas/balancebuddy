import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LoansList } from "@/components/personal-finance/loans/loans-list";

export default async function LoansPage() {
  if (!(await getSession())) redirect("/login");
  return <LoansList />;
}
