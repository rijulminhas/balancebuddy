import type { Metadata } from "next";
import { ExpensesList } from "@/components/expenses/expenses-list";

export const metadata: Metadata = { title: "Expenses" };

export default function ExpensesPage() {
  return <ExpensesList />;
}
