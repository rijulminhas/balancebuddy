import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PfShell } from "@/components/personal-finance/layout/pf-shell";

export default async function PersonalFinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <PfShell session={session}>{children}</PfShell>;
}
