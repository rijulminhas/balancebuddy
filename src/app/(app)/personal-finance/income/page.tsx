import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { IncomeList } from "@/components/personal-finance/income/income-list";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <IncomeList page={page} userId={session.user.id} />;
}
