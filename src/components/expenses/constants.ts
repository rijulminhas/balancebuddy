export const EXPENSE_CATEGORIES = [
  "groceries",
  "rent",
  "utilities",
  "internet",
  "repairs",
  "maintenance",
  "entertainment",
  "miscellaneous",
] as const;

export const SPLIT_TYPES = [
  { value: "equal", label: "Equal" },
  { value: "percentage", label: "By percentage %" },
  { value: "amount", label: "By exact amount ₹" },
] as const;

export const CATEGORY_COLORS: Record<
  string,
  "default" | "secondary" | "outline" | "success" | "warning" | "info"
> = {
  groceries: "success",
  rent: "default",
  utilities: "info",
  internet: "secondary",
  repairs: "warning",
  maintenance: "warning",
  entertainment: "info",
  miscellaneous: "outline",
};
