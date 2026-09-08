import { redirect } from "next/navigation";

export default async function FlatsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/groups/${id}`);
}
