import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PushSubscriptionManager } from "@/components/shared/push-subscription";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Pass the server session to SessionProvider so client components
  // (useSession, signOut) never need to make a separate fetch to
  // /api/auth/session — avoids CLIENT_FETCH_ERROR with Next.js 16.
  return (
    <SessionProvider session={session}>
      <PushSubscriptionManager />
      <AppShell session={session}>{children}</AppShell>
    </SessionProvider>
  );
}
