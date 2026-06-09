import type { Metadata } from "next";
import { NewChoreCard } from "@/components/chores/new-chore-card";

export const metadata: Metadata = { title: "New Chore" };

export default function NewChorePage() {
  return <NewChoreCard />;
}
