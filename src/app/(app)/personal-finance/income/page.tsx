import { IncomeList } from "@/components/personal-finance/income/income-list";

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <IncomeList page={page} />;
}
