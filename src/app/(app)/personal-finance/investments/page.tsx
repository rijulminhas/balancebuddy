import { InvestmentsList } from "@/components/personal-finance/investments/investments-list";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <InvestmentsList page={page} />;
}
