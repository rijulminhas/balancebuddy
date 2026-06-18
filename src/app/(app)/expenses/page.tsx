import type { Metadata } from "next";
import { ExpensesList } from "@/components/expenses/expenses-list";

export const metadata: Metadata = { title: "Expenses" };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const statusFilter =
    status === "pending" || status === "settled" ? status : "all";
  return <ExpensesList page={page} statusFilter={statusFilter} />;
}
