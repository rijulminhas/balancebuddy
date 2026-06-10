import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity/activity-feed";

export const metadata: Metadata = { title: "Activity Log" };

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  return <ActivityFeed page={page} />;
}
