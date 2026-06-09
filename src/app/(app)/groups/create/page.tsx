import type { Metadata } from "next";
import { CreateGroupForm } from "@/components/groups/create-group-form";

export const metadata: Metadata = { title: "Create Group" };

export default function CreateGroupPage() {
  return <CreateGroupForm />;
}
