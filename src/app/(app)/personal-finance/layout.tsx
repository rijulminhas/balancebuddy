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

  const superAdmin =
    !!session.user.email &&
    !!process.env.SUPER_ADMIN_EMAIL &&
    session.user.email === process.env.SUPER_ADMIN_EMAIL;

  return <PfShell session={session} isSuperAdmin={superAdmin}>{children}</PfShell>;
}
