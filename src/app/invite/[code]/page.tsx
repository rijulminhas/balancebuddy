import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flats, flatMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Home, Users, ArrowRight, AlertCircle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const [flat] = await db
    .select({ name: flats.name })
    .from(flats)
    .where(eq(flats.inviteCode, code.toUpperCase()))
    .limit(1);

  return {
    title: flat ? `Join ${flat.name} on RoomSync` : "Invalid invite",
  };
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upperCode = code.toUpperCase();

  const [flat] = await db
    .select({ id: flats.id, name: flats.name })
    .from(flats)
    .where(eq(flats.inviteCode, upperCode))
    .limit(1);

  if (!flat) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Logo />
        <div className="mt-12 w-full max-w-sm text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Invalid invite link</h1>
          <p className="text-sm text-muted-foreground">
            This invite link is invalid or has expired. Ask your flatmate for a
            new one.
          </p>
          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  const session = await getServerSession(authOptions);

  if (session?.user?.id) {
    const userId = session.user.id;

    // Check if already active in a *different* flat
    const allActive = await db
      .select({ flatId: flatMembers.flatId })
      .from(flatMembers)
      .where(and(eq(flatMembers.userId, userId), eq(flatMembers.status, "active")));

    const inOtherFlat = allActive.some((m) => m.flatId !== flat.id);
    if (inOtherFlat) {
      redirect(`/flats?invite_error=${encodeURIComponent("You are already a member of another flat")}`);
    }

    // Upsert: insert or re-activate — idempotent, race-condition safe
    await db
      .insert(flatMembers)
      .values({
        flatId: flat.id,
        userId,
        role: "member",
        status: "active",
        joinedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [flatMembers.flatId, flatMembers.userId],
        set: { status: "active", joinedAt: new Date(), updatedAt: new Date() },
      });

    redirect(`/flats?joined=${encodeURIComponent(flat.name)}`);
  }

  const callbackUrl = encodeURIComponent(`/invite/${code}`);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Logo />

      <div className="mt-10 w-full max-w-md text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
          <Users className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            You&apos;re invited!
          </h1>
          <p className="text-muted-foreground">
            Join{" "}
            <span className="font-semibold text-foreground">{flat.name}</span>{" "}
            on RoomSync — the all-in-one platform for shared living.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 text-left space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            What you&apos;ll get access to
          </p>
          {[
            "Split & track shared expenses",
            "Manage chores and assign tasks",
            "Track inventory and household items",
            "Settle debts with one tap",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2.5 text-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {feature}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-1">
          <Button
            asChild
            size="lg"
            className="w-full rounded-xl font-semibold h-12"
          >
            <Link href={`/login?callbackUrl=${callbackUrl}`}>
              Sign in to join
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full rounded-xl font-semibold h-12"
          >
            <Link href={`/register?callbackUrl=${callbackUrl}`}>
              Create a free account
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/login?callbackUrl=${callbackUrl}`}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
        <Home className="h-4.5 w-4.5 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold tracking-tight">RoomSync</span>
    </div>
  );
}
