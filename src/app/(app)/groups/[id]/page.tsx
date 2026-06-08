import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupMembers, groups, groupHistory, users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect, notFound } from "next/navigation";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, LogIn, Lock } from "lucide-react";

export const metadata: Metadata = { title: "Group Details" };

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const roleBadge: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  member: "outline",
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const [historyEntry] = await db
    .select({ role: groupHistory.role, leftAt: groupHistory.leftAt, inviteCode: groupHistory.inviteCode })
    .from(groupHistory)
    .where(and(eq(groupHistory.userId, userId), eq(groupHistory.groupId, id), isNull(groupHistory.deletedAt)))
    .limit(1);

  if (!historyEntry) notFound();

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, id))
    .limit(1);

  if (!group) notFound();

  const [activeMembership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .limit(1);

  const isInGroup = !!activeMembership;
  const isCurrentGroup = activeMembership?.groupId === id;

  if (isCurrentGroup) redirect("/groups");

  const members = await db
    .select({
      id: groupMembers.id,
      userId: groupMembers.userId,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      name: users.name,
      email: users.email,
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(and(eq(groupMembers.groupId, id), eq(groupMembers.status, "active")));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/groups/history">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">Group Details</h1>
        </div>
        {!isInGroup && (
          <Button size="sm" asChild>
            <Link href={`/invite/${historyEntry.inviteCode}`}>
              <LogIn className="mr-2 h-4 w-4" />
              Rejoin
            </Link>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span>
          You left this group on {new Date(historyEntry.leftAt).toLocaleDateString()}. This is a read-only view.
          {isInGroup
            ? " Leave your current group to be able to rejoin."
            : " You can rejoin using the button above."}
        </span>
      </div>

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
            <Badge variant={roleBadge[historyEntry.role] ?? "outline"}>
              {historyEntry.role === "owner" ? "admin" : historyEntry.role} (past)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-muted/40 px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Invite code</p>
            <p className="mt-0.5 font-mono text-xs text-foreground">{group.inviteCode}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Current Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <p className="px-6 py-4 text-xs text-muted-foreground">No active members.</p>
          ) : (
            <ul>
              {members.map((member, i) => (
                <li key={member.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center gap-3 px-6 py-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {member.name}
                        {member.userId === userId && (
                          <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant={roleBadge[member.role] ?? "outline"}>
                      {member.role === "owner" ? "admin" : member.role}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
