import type { Metadata } from "next";
import { SettlementsList } from "@/components/settlements/settlements-list";

export const metadata: Metadata = { title: "Settlements" };

export default function SettlementsPage() {
  return <SettlementsList />;
}
