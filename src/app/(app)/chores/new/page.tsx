import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { groupMembers, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChoreForm } from "./chore-form";

export const metadata: Metadata = { title: "New Chore" };

export default async function NewChorePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, session.user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) redirect("/groups");

  const members = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .innerJoin(groupMembers, eq(groupMembers.userId, users.id))
    .where(
      and(
        eq(groupMembers.groupId, membership.groupId),
        eq(groupMembers.status, "active")
      )
    );

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">New Chore</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Create and assign a task for your group
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Chore details</CardTitle>
        </CardHeader>
        <CardContent>
          <ChoreForm
            groupId={membership.groupId}
            members={members.map((m) => ({
              id: m.id,
              name: m.name ?? "Unknown",
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
