import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, groupMembers, groups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Metadata } from "next";
import { format } from "date-fns";
import { Building2, Calendar, ShieldCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";

export const metadata: Metadata = { title: "Profile – Settings" };

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) redirect("/login");

  const [membership] = await db
    .select({
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
      groupName: groups.name,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(
      and(
        eq(groupMembers.userId, user.id),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);

  return (
    <div className="space-y-6">
      {/* Profile form */}
      <ProfileForm
        defaultValues={{
          name: user.name,
          email: user.email,
          image: user.image ?? "",
        }}
        userId={user.id}
      />

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
          <CardDescription>
            Read-only details about your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Member since</p>
              <p className="text-sm font-medium">
                {format(user.createdAt, "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          {user.emailVerified && (
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email verified</p>
                <p className="text-sm font-medium">
                  {format(user.emailVerified, "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          )}

          {membership ? (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground">Current group</p>
                  <p className="text-sm font-medium">{membership.groupName}</p>
                </div>
                <Badge variant="outline" className="text-xs capitalize">
                  {membership.role}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Current group</p>
                <p className="text-sm text-muted-foreground">Not in a group yet</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password change */}
      <PasswordForm />
    </div>
  );
}
