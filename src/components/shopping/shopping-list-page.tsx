import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/db";
import { shoppingItems, groupMembers, users } from "@/db/schema";
import { eq, and, inArray, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ShoppingListClient } from "./shopping-list-client";

export async function ShoppingListPage() {
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

  const rows = await db
    .select({
      id: shoppingItems.id,
      name: shoppingItems.name,
      quantity: shoppingItems.quantity,
      unit: shoppingItems.unit,
      category: shoppingItems.category,
      notes: shoppingItems.notes,
      isPurchased: shoppingItems.isPurchased,
      addedById: shoppingItems.addedById,
      sourceEssentialId: shoppingItems.sourceEssentialId,
      createdAt: shoppingItems.createdAt,
    })
    .from(shoppingItems)
    .where(eq(shoppingItems.groupId, groupId))
    .orderBy(desc(shoppingItems.createdAt));

  const adderIds = [...new Set(rows.map((r) => r.addedById))];

  const userRows =
    adderIds.length > 0
      ? await db
          .select({ id: users.id, name: users.name })
          .from(users)
          .where(inArray(users.id, adderIds))
      : [];

  const nameMap = new Map(userRows.map((u) => [u.id, u.name ?? "Unknown"]));

  const items = rows.map((r) => ({
    ...r,
    addedByName: nameMap.get(r.addedById) ?? "Unknown",
  }));

  return <ShoppingListClient items={items} groupId={groupId} />;
}
