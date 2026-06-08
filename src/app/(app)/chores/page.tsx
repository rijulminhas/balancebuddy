import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { chores, flatMembers, users } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Plus, Calendar, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ChoreActions } from "./chore-actions";

export const metadata: Metadata = { title: "Chores" };

const statusConfig = {
  pending: { label: "Pending", variant: "warning" as const },
  in_progress: { label: "In Progress", variant: "info" as const },
  completed: { label: "Completed", variant: "success" as const },
  skipped: { label: "Skipped", variant: "secondary" as const },
};

const frequencyLabel: Record<string, string> = {
  once: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

export default async function ChoresPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [membership] = await db
    .select({ flatId: flatMembers.flatId })
    .from(flatMembers)
    .where(
      and(
        eq(flatMembers.userId, session.user.id),
        eq(flatMembers.status, "active")
      )
    )
    .limit(1);

  if (!membership) redirect("/flats");

  const { flatId } = membership;

  const choreList = await db
    .select({
      id: chores.id,
      title: chores.title,
      description: chores.description,
      status: chores.status,
      frequency: chores.frequency,
      dueDate: chores.dueDate,
      completedAt: chores.completedAt,
      points: chores.points,
      isRecurring: chores.isRecurring,
      assignedToId: chores.assignedToId,
      createdById: chores.createdById,
      createdAt: chores.createdAt,
    })
    .from(chores)
    .where(eq(chores.flatId, flatId))
    .orderBy(desc(chores.createdAt));

  // Fetch member names
  const involvedIds = [
    ...new Set([
      ...choreList.map((c) => c.assignedToId).filter(Boolean) as string[],
      ...choreList.map((c) => c.createdById),
    ]),
  ];

  const memberRows =
    involvedIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, involvedIds))
      : [];

  const nameMap = new Map(memberRows.map((u) => [u.id, u.name ?? "Unknown"]));

  const pending = choreList.filter((c) => c.status === "pending");
  const inProgress = choreList.filter((c) => c.status === "in_progress");
  const completed = choreList.filter((c) => c.status === "completed");
  const mine = choreList.filter(
    (c) => c.assignedToId === session.user.id && c.status !== "completed"
  );

  const isOverdue = (dueDate: Date | null) =>
    dueDate && new Date(dueDate) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chores</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pending.length + inProgress.length} pending ·{" "}
            {completed.length} completed
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/chores/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Chore
          </Link>
        </Button>
      </div>

      {/* My chores highlight */}
      {mine.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
                <CheckSquare className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base font-bold">
                Assigned to you ({mine.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {mine.map((chore) => {
              const cfg = statusConfig[chore.status as keyof typeof statusConfig];
              const overdue = isOverdue(chore.dueDate);
              return (
                <div
                  key={chore.id}
                  className="flex items-center justify-between rounded-xl bg-background/70 px-4 py-3 gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold truncate">{chore.title}</p>
                      <Badge variant={cfg.variant} className="text-xs shrink-0">
                        {cfg.label}
                      </Badge>
                      {overdue && (
                        <Badge variant="destructive" className="text-xs shrink-0">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    {chore.dueDate && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Due {format(new Date(chore.dueDate), "dd MMM yyyy")}
                      </p>
                    )}
                  </div>
                  <ChoreActions
                    choreId={chore.id}
                    status={chore.status}
                    createdById={chore.createdById}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All chores */}
      {choreList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">No chores yet</p>
            <p className="mb-6 text-xs text-muted-foreground">
              Add chores to keep your flat organised.
            </p>
            <Button asChild size="sm">
              <Link href="/chores/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Chore
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* In-progress */}
          {inProgress.length > 0 && (
            <ChoreSection
              title="In Progress"
              chores={inProgress}
              nameMap={nameMap}
              currentUserId={session.user.id}
            />
          )}
          {/* Pending */}
          {pending.length > 0 && (
            <ChoreSection
              title="Pending"
              chores={pending}
              nameMap={nameMap}
              currentUserId={session.user.id}
            />
          )}
          {/* Completed */}
          {completed.length > 0 && (
            <ChoreSection
              title="Completed"
              chores={completed}
              nameMap={nameMap}
              currentUserId={session.user.id}
              muted
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ChoreSectionProps {
  title: string;
  chores: Array<{
    id: string;
    title: string;
    description: string | null;
    status: string;
    frequency: string;
    dueDate: Date | null;
    completedAt: Date | null;
    points: number | null;
    isRecurring: boolean;
    assignedToId: string | null;
    createdById: string;
    createdAt: Date;
  }>;
  nameMap: Map<string, string>;
  currentUserId: string;
  muted?: boolean;
}

function ChoreSection({
  title,
  chores: items,
  nameMap,
  currentUserId,
  muted,
}: ChoreSectionProps) {
  const isOverdue = (dueDate: Date | null) =>
    dueDate && new Date(dueDate) < new Date();

  return (
    <Card className={`border-border/60 ${muted ? "opacity-75" : ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title} · {items.length}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((chore) => {
          const cfg = statusConfig[chore.status as keyof typeof statusConfig];
          const overdue = isOverdue(chore.dueDate);
          const isAssignedToMe = chore.assignedToId === currentUserId;

          return (
            <div
              key={chore.id}
              className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3 gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className={`text-sm font-medium truncate ${
                      muted ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {chore.title}
                  </p>
                  {isAssignedToMe && (
                    <Badge variant="warning" className="text-xs shrink-0">
                      Yours
                    </Badge>
                  )}
                  {overdue && !muted && (
                    <Badge variant="destructive" className="text-xs shrink-0">
                      Overdue
                    </Badge>
                  )}
                  {chore.isRecurring && (
                    <RotateCcw className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  {chore.assignedToId && (
                    <p className="text-xs text-muted-foreground">
                      Assigned to{" "}
                      {isAssignedToMe
                        ? "you"
                        : nameMap.get(chore.assignedToId) ?? "Unknown"}
                    </p>
                  )}
                  {chore.dueDate && !muted && (
                    <p
                      className={`flex items-center gap-1 text-xs ${
                        overdue ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      <Calendar className="h-3 w-3" />
                      {format(new Date(chore.dueDate), "dd MMM")}
                    </p>
                  )}
                  {chore.status === "completed" && chore.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed {format(new Date(chore.completedAt), "dd MMM")}
                    </p>
                  )}
                  {chore.frequency !== "once" && (
                    <Badge variant="outline" className="text-xs py-0 h-4">
                      {frequencyLabel[chore.frequency]}
                    </Badge>
                  )}
                </div>
              </div>
              {!muted && (
                <ChoreActions
                  choreId={chore.id}
                  status={chore.status}
                  createdById={chore.createdById}
                />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
