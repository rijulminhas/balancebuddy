import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { groupHistory, groupMembers } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HistoryDeleteButton } from "./history-delete-button";
import { BackButton } from "@/components/ui/back-button";
import { Home, LogIn, History } from "lucide-react";

interface GroupHistoryProps {
  title?: string;
}

export async function GroupHistory({ title = "Group History" }: GroupHistoryProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = session.user.id;

  const history = await db
    .select()
    .from(groupHistory)
    .where(and(eq(groupHistory.userId, userId), isNull(groupHistory.deletedAt)))
    .orderBy(desc(groupHistory.lastLeftAt));

  const [activeMembership] = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .limit(1);

  const isInGroup = !!activeMembership;

  const emptyText = title === "Room History" ? "No room history yet" : "No group history yet";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/groups">
            <Home className="mr-2 h-4 w-4" />
            My Group
          </Link>
        </Button>
      </div>

      {history.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <History className="mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{emptyText}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Groups you leave will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {history.map((entry) => (
            <li key={entry.id}>
              <Card>
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{entry.groupName}</p>
                      <Badge variant="outline" className="text-xs">
                        {entry.role === "owner" ? "admin" : entry.role}
                      </Badge>
                      {entry.deletedByOwner && (
                        <Badge variant="secondary" className="text-xs">deleted</Badge>
                      )}
                    </div>
                    {entry.groupAddress && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.groupAddress}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Left on {new Date(entry.lastLeftAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!entry.deletedByOwner && (
                      <>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/groups/${entry.groupId}`}>
                            <Home className="mr-1.5 h-3.5 w-3.5" />
                            View
                          </Link>
                        </Button>
                        {!isInGroup && (
                          <Button size="sm" asChild>
                            <Link href={`/invite/${entry.inviteCode}`}>
                              <LogIn className="mr-1.5 h-3.5 w-3.5" />
                              Rejoin
                            </Link>
                          </Button>
                        )}
                      </>
                    )}
                    <HistoryDeleteButton historyId={entry.id} isOwner={entry.role === "owner"} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
