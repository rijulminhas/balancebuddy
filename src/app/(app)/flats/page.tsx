import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { flatMembers, flats, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plus, UserPlus } from "lucide-react";

import { FlatActions } from "./flat-actions";
import { CopyInviteButton, CopyInviteCodeButton } from "./copy-invite-button";
import { JoinSuccessModal } from "./join-success-modal";
import { SendInviteForm } from "./send-invite-form";

export const metadata: Metadata = { title: "My Flat" };

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const roleBadge: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

export default async function FlatsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [membership] = await db
    .select({
      flatId: flatMembers.flatId,
      role: flatMembers.role,
    })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.userId, session.user.id),
        eq(flatMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Flat</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-2 text-sm font-medium">You&apos;re not in a flat yet</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Create a new flat or join an existing one with an invite code.
            </p>
            <div className="flex gap-3">
              <Button asChild size="sm">
                <Link href="/flats/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create flat
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/flats/join">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join flat
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [flat] = await db
    .select()
    .from(flats)
    .where(eq(flats.id, membership.flatId))
    .limit(1);

  const members = await db
    .select({
      id: flatMembers.id,
      userId: flatMembers.userId,
      role: flatMembers.role,
      joinedAt: flatMembers.joinedAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(flatMembers)
    .innerJoin(users, eq(flatMembers.userId, users.id))
    .where(
      and(eq(flatMembers.flatId, membership.flatId), eq(flatMembers.status, "active"))
    );

  return (
    <div className="space-y-6">
      <JoinSuccessModal />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Flat</h1>
        <FlatActions
          flatId={flat.id}
          role={membership.role}
          userId={session.user.id}
        />
      </div>

      {/* Flat info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{flat.name}</CardTitle>
              {flat.description && (
                <CardDescription className="mt-1">
                  {flat.description}
                </CardDescription>
              )}
              {flat.address && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {flat.address}
                </p>
              )}
            </div>
            <Badge variant={roleBadge[membership.role] ?? "outline"}>
              {membership.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Invite link</p>
              <p className="mt-0.5 truncate font-mono text-xs text-foreground">
                /invite/{flat.inviteCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyInviteCodeButton code={flat.inviteCode} />
              <CopyInviteButton code={flat.inviteCode} />
            </div>
          </div>
          <SendInviteForm flatId={flat.id} />
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul>
            {members.map((member, i) => (
              <li key={member.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.name}
                        {member.userId === session.user.id && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant={roleBadge[member.role] ?? "outline"}>
                    {member.role}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
