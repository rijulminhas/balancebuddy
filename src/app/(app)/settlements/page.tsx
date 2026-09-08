import type { Metadata } from "next";
import { SettlementsList } from "@/components/settlements/settlements-list";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Settlements" };

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    historyStatus?: string;
    historyMonth?: string;
  }>;
}) {
  const { page: pageParam, historyStatus, historyMonth } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const statusFilter =
    historyStatus === "pending" ||
    historyStatus === "completed" ||
    historyStatus === "rejected"
      ? historyStatus
      : "all";
  const monthFilter = historyMonth ?? "all";

  return (
    <SettlementsList
      historyPage={page}
      historyStatus={statusFilter}
      historyMonth={monthFilter}
    />
  );
}
