export function isOverdue(dueDate: Date | null): boolean {
  return !!dueDate && new Date(dueDate) < new Date();
}
