import type { Metadata } from "next";
import { GroupHistory } from "@/components/groups/group-history";

export const metadata: Metadata = { title: "Room History" };

export default function RoomHistoryPage() {
  return <GroupHistory title="Room History" />;
}
