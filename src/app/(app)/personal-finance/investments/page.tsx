import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { InvestmentsList } from "@/components/personal-finance/investments/investments-list";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getSession())) redirect("/login");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <InvestmentsList page={page} />;
}
