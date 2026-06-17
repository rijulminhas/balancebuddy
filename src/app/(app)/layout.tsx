import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PushSubscriptionManager } from "@/components/shared/push-subscription";

export default async function AppLayout({
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

  // Pass the server session to SessionProvider so client components
  // (useSession, signOut) never need to make a separate fetch to
  // /api/auth/session — avoids CLIENT_FETCH_ERROR with Next.js 16.
  return (
    <SessionProvider session={session}>
      <PushSubscriptionManager />
      <AppShell session={session} isSuperAdmin={superAdmin}>{children}</AppShell>
    </SessionProvider>
  );
}
