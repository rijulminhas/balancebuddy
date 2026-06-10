import type { Metadata } from "next";
import { ActivityFeed } from "@/components/activity/activity-feed";

export const metadata: Metadata = { title: "Activity Log" };

export default function ActivityPage() {
  return <ActivityFeed />;
}
