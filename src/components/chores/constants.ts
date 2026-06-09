export const STATUS_CONFIG = {
  pending: { label: "Pending", variant: "warning" as const },
  in_progress: { label: "In Progress", variant: "info" as const },
  completed: { label: "Completed", variant: "success" as const },
  skipped: { label: "Skipped", variant: "secondary" as const },
};

export const FREQUENCY_LABEL: Record<string, string> = {
  once: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

export const FREQUENCY_OPTIONS = [
  { value: "once" as const, label: "One-time" },
  { value: "daily" as const, label: "Daily" },
  { value: "weekly" as const, label: "Weekly" },
  { value: "biweekly" as const, label: "Every 2 weeks" },
  { value: "monthly" as const, label: "Monthly" },
];
