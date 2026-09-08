import type { Metadata } from "next";
import { GroupDetail } from "@/components/groups/group-detail";

export const metadata: Metadata = { title: "Group Details" };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetail id={id} />;
}
