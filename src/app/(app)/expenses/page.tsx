import type { Metadata } from "next";
import { ExpensesList } from "@/components/expenses/expenses-list";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <ExpensesList page={page} />;
}
