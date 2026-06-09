import type { Metadata } from "next";
import { GroupHistory } from "@/components/groups/group-history";

export const metadata: Metadata = { title: "Group History" };

export default function GroupHistoryPage() {
  return <GroupHistory />;
}
