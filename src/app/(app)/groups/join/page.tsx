import type { Metadata } from "next";
import { JoinGroupForm } from "@/components/groups/join-group-form";

export const metadata: Metadata = { title: "Join Group" };

export default function JoinGroupPage() {
  return <JoinGroupForm />;
}
