import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupMembers, groups, users } from "@/db/schema";
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

import { GroupActions } from "./flat-actions";
import { MemberActions } from "./member-actions";
import { CopyInviteButton, CopyInviteCodeButton } from "./copy-invite-button";
import { JoinSuccessModal } from "./join-success-modal";
import { SendInviteForm } from "./send-invite-form";

export const metadata: Metadata = { title: "My Group" };

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

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ groupId: groupMembers.groupId, role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Group</h1>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-2 text-sm font-medium">You&apos;re not in a group yet</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Create a new group or join an existing one with an invite code.
            </p>
            <div className="flex gap-3">
              <Button asChild size="sm">
                <Link href="/groups/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create group
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/groups/join">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Join group
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, membership.groupId))
    .limit(1);

  const members = await db
    .select({
      id: groupMembers.id,
      userId: groupMembers.userId,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(
      and(eq(groupMembers.groupId, membership.groupId), eq(groupMembers.status, "active"))
    );

  const isOwner = membership.role === "owner";

  return (
    <div className="space-y-6">
      <JoinSuccessModal />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Group</h1>
        <GroupActions
          groupId={group.id}
          role={membership.role}
          userId={session.user.id}
          members={members.map((m) => ({
            userId: m.userId,
            name: m.name,
            avatarUrl: `/api/users/${m.userId}/avatar`,
          }))}
        />
      </div>

      {/* Group info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{group.name}</CardTitle>
              {group.description && (
                <CardDescription className="mt-1">{group.description}</CardDescription>
              )}
              {group.address && (
                <p className="mt-1 text-xs text-muted-foreground">{group.address}</p>
              )}
            </div>
            <Badge variant={roleBadge[membership.role] ?? "outline"}>
              {membership.role === "owner" ? "admin" : membership.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Invite link</p>
              <p className="mt-0.5 truncate font-mono text-xs text-foreground">
                /invite/{group.inviteCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CopyInviteCodeButton code={group.inviteCode} />
              <CopyInviteButton code={group.inviteCode} />
            </div>
          </div>
          <SendInviteForm groupId={group.id} />
        </CardContent>
      </Card>

      {/* Members card */}
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
                      <AvatarImage src={`/api/users/${member.userId}/avatar`} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {member.name}
                        {member.userId === session.user.id && (
                          <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={roleBadge[member.role] ?? "outline"}>
                      {member.role === "owner" ? "admin" : member.role}
                    </Badge>
                    {isOwner && member.userId !== session.user.id && (
                      <MemberActions
                        groupId={group.id}
                        requesterId={session.user.id}
                        target={{ userId: member.userId, name: member.name }}
                      />
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
