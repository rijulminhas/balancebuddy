import { PersonalExpensesList } from "@/components/personal-finance/expenses/personal-expenses-list";

export default async function PersonalExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <PersonalExpensesList page={page} />;
}
