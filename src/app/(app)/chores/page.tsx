import type { Metadata } from "next";
import { ChoreList } from "@/components/chores/chore-list";

export const metadata: Metadata = { title: "Chores" };

export default function ChoresPage() {
  return <ChoreList />;
}
