import type { Metadata } from "next";
import { SettlementsList } from "@/components/settlements/settlements-list";

export const metadata: Metadata = { title: "Settlements" };

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <SettlementsList historyPage={page} />;
}
