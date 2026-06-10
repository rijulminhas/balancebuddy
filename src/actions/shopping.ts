"use server";

import { db } from "@/db";
import {
  monthlyEssentials,
  shoppingItems,
  groupMembers,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";

const essentialSchema = z.object({
  groupId: z.string().uuid(),
  name: z.string().min(1, "Name is required").max(255),
  quantity: z.string().max(20).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(100).default("Groceries"),
  notes: z.string().max(500).optional(),
});

const updateEssentialSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  quantity: z.string().max(20).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(100).default("Groceries"),
  notes: z.string().max(500).optional(),
});

async function assertMembership(userId: string, groupId: string) {
  const [membership] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active")
      )
    )
    .limit(1);
  return membership ?? null;
}

export async function createEssential(
  userId: string,
  input: z.infer<typeof essentialSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = essentialSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const { groupId, quantity, unit, notes, ...rest } = parsed.data;

  if (!(await assertMembership(userId, groupId))) {
    return { success: false, error: "Not a member of this group" };
  }

  const [item] = await db
    .insert(monthlyEssentials)
    .values({
      groupId,
      createdById: userId,
      quantity: quantity && quantity.trim() !== "" ? quantity : null,
      unit: unit && unit.trim() !== "" ? unit : null,
      notes: notes && notes.trim() !== "" ? notes : null,
      ...rest,
    })
    .returning({ id: monthlyEssentials.id });

  revalidatePath("/shopping");
  return { success: true, data: { id: item.id } };
}

export async function updateEssential(
  userId: string,
  id: string,
  input: z.infer<typeof updateEssentialSchema>
): Promise<ActionResult> {
  const parsed = updateEssentialSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [item] = await db
    .select({ id: monthlyEssentials.id, groupId: monthlyEssentials.groupId })
    .from(monthlyEssentials)
    .where(eq(monthlyEssentials.id, id))
    .limit(1);

  if (!item) return { success: false, error: "Item not found" };

  if (!(await assertMembership(userId, item.groupId))) {
    return { success: false, error: "Not authorized" };
  }

  const { quantity, unit, notes, ...rest } = parsed.data;

  await db
    .update(monthlyEssentials)
    .set({
      ...rest,
      quantity: quantity && quantity.trim() !== "" ? quantity : null,
      unit: unit && unit.trim() !== "" ? unit : null,
      notes: notes && notes.trim() !== "" ? notes : null,
      updatedAt: new Date(),
    })
    .where(eq(monthlyEssentials.id, id));

  revalidatePath("/shopping");
  return { success: true };
}

export async function deleteEssential(
  userId: string,
  id: string
): Promise<ActionResult> {
  const [item] = await db
    .select({ id: monthlyEssentials.id, groupId: monthlyEssentials.groupId })
    .from(monthlyEssentials)
    .where(eq(monthlyEssentials.id, id))
    .limit(1);

  if (!item) return { success: false, error: "Item not found" };

  if (!(await assertMembership(userId, item.groupId))) {
    return { success: false, error: "Not authorized" };
  }

  await db.delete(monthlyEssentials).where(eq(monthlyEssentials.id, id));

  revalidatePath("/shopping");
  return { success: true };
}

export async function archiveEssential(
  userId: string,
  id: string,
  archive: boolean
): Promise<ActionResult> {
  const [item] = await db
    .select({ id: monthlyEssentials.id, groupId: monthlyEssentials.groupId })
    .from(monthlyEssentials)
    .where(eq(monthlyEssentials.id, id))
    .limit(1);

  if (!item) return { success: false, error: "Item not found" };

  if (!(await assertMembership(userId, item.groupId))) {
    return { success: false, error: "Not authorized" };
  }

  await db
    .update(monthlyEssentials)
    .set({ isArchived: archive, updatedAt: new Date() })
    .where(eq(monthlyEssentials.id, id));

  revalidatePath("/shopping");
  return { success: true };
}

export async function addEssentialsToShoppingList(
  userId: string,
  groupId: string,
  essentialIds: string[]
): Promise<ActionResult<{ count: number; skipped: number }>> {
  if (essentialIds.length === 0) {
    return { success: false, error: "No items selected" };
  }

  if (!(await assertMembership(userId, groupId))) {
    return { success: false, error: "Not authorized" };
  }

  const essentials = await db
    .select()
    .from(monthlyEssentials)
    .where(
      and(
        eq(monthlyEssentials.groupId, groupId),
        inArray(monthlyEssentials.id, essentialIds),
        eq(monthlyEssentials.isArchived, false)
      )
    );

  if (essentials.length === 0) {
    return { success: false, error: "No valid items found" };
  }

  // Find essentials already on the list as unpurchased items
  const alreadyAdded = await db
    .select({ sourceEssentialId: shoppingItems.sourceEssentialId })
    .from(shoppingItems)
    .where(
      and(
        eq(shoppingItems.groupId, groupId),
        eq(shoppingItems.isPurchased, false),
        inArray(
          shoppingItems.sourceEssentialId,
          essentials.map((e) => e.id)
        )
      )
    );

  const alreadyAddedIds = new Set(
    alreadyAdded.map((r) => r.sourceEssentialId).filter(Boolean) as string[]
  );

  const toAdd = essentials.filter((e) => !alreadyAddedIds.has(e.id));
  const skipped = essentials.length - toAdd.length;

  if (toAdd.length === 0) {
    return {
      success: false,
      error:
        skipped === 1
          ? "This item is already on the shopping list."
          : `All ${skipped} selected items are already on the shopping list.`,
    };
  }

  const now = new Date();

  await db.insert(shoppingItems).values(
    toAdd.map((item) => ({
      groupId,
      addedById: userId,
      sourceEssentialId: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      notes: item.notes,
    }))
  );

  for (const item of toAdd) {
    await db
      .update(monthlyEssentials)
      .set({
        lastAddedToShoppingAt: now,
        addedCount: item.addedCount + 1,
        updatedAt: now,
      })
      .where(eq(monthlyEssentials.id, item.id));
  }

  revalidatePath("/shopping");
  return { success: true, data: { count: toAdd.length, skipped } };
}

const shoppingItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  quantity: z.string().max(20).optional(),
  unit: z.string().max(50).optional(),
  category: z.string().max(100).default("Groceries"),
  notes: z.string().max(500).optional(),
});

export async function createShoppingItem(
  userId: string,
  groupId: string,
  input: z.infer<typeof shoppingItemSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = shoppingItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  if (!(await assertMembership(userId, groupId))) {
    return { success: false, error: "Not a member of this group" };
  }

  const { quantity, unit, notes, ...rest } = parsed.data;

  const [item] = await db
    .insert(shoppingItems)
    .values({
      groupId,
      addedById: userId,
      quantity: quantity && quantity.trim() !== "" ? quantity : null,
      unit: unit && unit.trim() !== "" ? unit : null,
      notes: notes && notes.trim() !== "" ? notes : null,
      ...rest,
    })
    .returning({ id: shoppingItems.id });

  revalidatePath("/shopping");
  return { success: true, data: { id: item.id } };
}

export async function updateShoppingItem(
  userId: string,
  itemId: string,
  input: z.infer<typeof shoppingItemSchema>
): Promise<ActionResult> {
  const parsed = shoppingItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "Invalid input" };

  const [item] = await db
    .select({ id: shoppingItems.id, groupId: shoppingItems.groupId })
    .from(shoppingItems)
    .where(eq(shoppingItems.id, itemId))
    .limit(1);

  if (!item) return { success: false, error: "Item not found" };

  if (!(await assertMembership(userId, item.groupId))) {
    return { success: false, error: "Not authorized" };
  }

  const { quantity, unit, notes, ...rest } = parsed.data;

  await db
    .update(shoppingItems)
    .set({
      ...rest,
      quantity: quantity && quantity.trim() !== "" ? quantity : null,
      unit: unit && unit.trim() !== "" ? unit : null,
      notes: notes && notes.trim() !== "" ? notes : null,
      updatedAt: new Date(),
    })
    .where(eq(shoppingItems.id, itemId));

  revalidatePath("/shopping");
  return { success: true };
}

export async function toggleShoppingItemPurchased(
  userId: string,
  itemId: string
): Promise<ActionResult> {
  const [item] = await db
    .select({
      id: shoppingItems.id,
      groupId: shoppingItems.groupId,
      isPurchased: shoppingItems.isPurchased,
    })
    .from(shoppingItems)
    .where(eq(shoppingItems.id, itemId))
    .limit(1);

  if (!item) return { success: false, error: "Item not found" };

  if (!(await assertMembership(userId, item.groupId))) {
    return { success: false, error: "Not authorized" };
  }

  await db
    .update(shoppingItems)
    .set({ isPurchased: !item.isPurchased, updatedAt: new Date() })
    .where(eq(shoppingItems.id, itemId));

  revalidatePath("/shopping");
  return { success: true };
}

export async function deleteShoppingItem(
  userId: string,
  itemId: string
): Promise<ActionResult> {
  const [item] = await db
    .select({ id: shoppingItems.id, groupId: shoppingItems.groupId })
    .from(shoppingItems)
    .where(eq(shoppingItems.id, itemId))
    .limit(1);

  if (!item) return { success: false, error: "Item not found" };

  if (!(await assertMembership(userId, item.groupId))) {
    return { success: false, error: "Not authorized" };
  }

  await db.delete(shoppingItems).where(eq(shoppingItems.id, itemId));

  revalidatePath("/shopping");
  return { success: true };
}
