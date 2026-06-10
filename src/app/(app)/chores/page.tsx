import type { Metadata } from "next";
import { ChoreList } from "@/components/chores/chore-list";

export const metadata: Metadata = { title: "Chores" };

export default async function ChoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <ChoreList completedPage={page} />;
}
