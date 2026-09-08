export type ChoreStatus = "pending" | "in_progress" | "completed" | "skipped";
export type ChoreFrequency = "once" | "daily" | "weekly" | "biweekly" | "monthly";

export interface ChoreMember {
  id: string;
  name: string;
}

export interface ChoreItem {
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
}
