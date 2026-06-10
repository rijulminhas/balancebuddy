export const ESSENTIAL_CATEGORIES = [
  "Groceries",
  "Dairy",
  "Bakery",
  "Beverages",
  "Snacks",
  "Cleaning",
  "Toiletries",
  "Kitchen",
  "Household",
  "Personal Care",
  "Vegetables",
  "Fruits",
  "Meat & Fish",
  "Frozen",
  "Spices",
  "Other",
] as const;

export const ESSENTIAL_UNITS = [
  "kg",
  "gm",
  "litre",
  "ml",
  "packet",
  "piece",
  "dozen",
  "box",
  "bottle",
  "can",
  "bag",
  "roll",
  "bar",
  "sachet",
  "bundle",
] as const;

export type EssentialCategory = (typeof ESSENTIAL_CATEGORIES)[number];
export type EssentialUnit = (typeof ESSENTIAL_UNITS)[number];
