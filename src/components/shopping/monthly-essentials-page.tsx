import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { monthlyEssentials, groupMembers, users } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { EssentialsClient } from "./essentials-client";

interface MonthlyEssentialsPageProps {
  showArchived?: boolean;
}

export async function MonthlyEssentialsPage({
  showArchived = false,
}: MonthlyEssentialsPageProps) {
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

  const { groupId } = membership;

  const essentialRows = await db
    .select({
      id: monthlyEssentials.id,
      name: monthlyEssentials.name,
      quantity: monthlyEssentials.quantity,
      unit: monthlyEssentials.unit,
      category: monthlyEssentials.category,
      notes: monthlyEssentials.notes,
      isArchived: monthlyEssentials.isArchived,
      addedCount: monthlyEssentials.addedCount,
      lastAddedToShoppingAt: monthlyEssentials.lastAddedToShoppingAt,
      createdById: monthlyEssentials.createdById,
      createdAt: monthlyEssentials.createdAt,
      updatedAt: monthlyEssentials.updatedAt,
    })
    .from(monthlyEssentials)
    .where(eq(monthlyEssentials.groupId, groupId))
    .orderBy(desc(monthlyEssentials.createdAt));

  const creatorIds = [...new Set(essentialRows.map((r) => r.createdById))];

  const userRows =
    creatorIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, creatorIds))
      : [];

  const nameMap = new Map(userRows.map((u) => [u.id, u.name ?? "Unknown"]));

  const items = essentialRows.map((r) => ({
    ...r,
    createdByName: nameMap.get(r.createdById) ?? "Unknown",
  }));

  return (
    <EssentialsClient
      items={items}
      groupId={groupId}
      showArchived={showArchived}
    />
  );
}
