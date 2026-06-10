export interface EssentialItem {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  category: string;
  notes: string | null;
  isArchived: boolean;
  addedCount: number;
  lastAddedToShoppingAt: Date | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdByName: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string | null;
  unit: string | null;
  category: string;
  notes: string | null;
  isPurchased: boolean;
  addedById: string;
  sourceEssentialId: string | null;
  createdAt: Date;
  addedByName: string;
}
