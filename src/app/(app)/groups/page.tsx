import type { Metadata } from "next";
import { GroupsPage } from "@/components/groups/groups-page";

export const metadata: Metadata = { title: "My Group" };

export default function GroupsRoute() {
  return <GroupsPage />;
}
