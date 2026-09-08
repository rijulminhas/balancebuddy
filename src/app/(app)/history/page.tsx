import type { Metadata } from "next";
import { GroupHistory } from "@/components/groups/group-history";

export const metadata: Metadata = { title: "Switch Group" };

export default function RoomHistoryPage() {
  return <GroupHistory />;
}
