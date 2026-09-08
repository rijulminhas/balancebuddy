import type { Metadata } from "next";
import { ExpenseDetail } from "@/components/expenses/expense-detail";

export const metadata: Metadata = { title: "Expense Details" };

export default function ExpenseDetailPage() {
  return <ExpenseDetail />;
}
