import { z } from "zod";

export type ReminderFrequency = "daily" | "weekly" | "monthly" | "yearly" | "one_time";

export const reminderInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(500).optional(),
  amount: z.string().optional(),
  type: z.enum(["rent", "emi", "electricity", "water", "internet", "subscription", "custom"]),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly", "one_time"]),
  groupId: z.uuid().optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  monthOfYear: z.number().int().min(1).max(12).optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  specificDate: z.iso.datetime().optional(),
  reminderDaysBefore: z.number().int().min(0).max(30).optional(),
});

export type ReminderInput = z.infer<typeof reminderInputSchema>;

interface ScheduleOptions {
  dayOfMonth?: number | null;
  monthOfYear?: number | null;
  dayOfWeek?: number | null;
  specificDate?: Date | null;
}

/**
 * Computes the next datetime to fire a push notification for a reminder.
 *
 * The notification fires `reminderDaysBefore` days before the actual due date
 * at 09:00 local server time.  Default is 1 day (= 24 h before).
 *
 * Returns null when there is no future trigger (e.g. a past one_time reminder).
 */
export function computeNextNotifyAt(
  frequency: ReminderFrequency,
  reminderDaysBefore: number,
  options: ScheduleOptions,
  from: Date = new Date()
): Date | null {
  const now = new Date(from);

  switch (frequency) {
    case "one_time": {
      if (!options.specificDate) return null;
      const notify = new Date(options.specificDate);
      notify.setDate(notify.getDate() - reminderDaysBefore);
      notify.setHours(9, 0, 0, 0);
      return notify > now ? notify : null;
    }

    case "daily": {
      const next = new Date(now);
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      return next;
    }

    case "weekly": {
      const targetDow = options.dayOfWeek ?? 1; // default Monday
      const base = new Date(now);
      base.setHours(9, 0, 0, 0);

      let daysUntilDue = (targetDow - base.getDay() + 7) % 7;
      if (daysUntilDue === 0) daysUntilDue = 7; // ensure at least 1 week ahead

      const dueDate = new Date(base);
      dueDate.setDate(dueDate.getDate() + daysUntilDue);

      const notifyDate = new Date(dueDate);
      notifyDate.setDate(notifyDate.getDate() - reminderDaysBefore);

      if (notifyDate > now) return notifyDate;
      // Already past — push to next week's cycle
      notifyDate.setDate(notifyDate.getDate() + 7);
      return notifyDate;
    }

    case "monthly": {
      const dom = options.dayOfMonth ?? 1;

      const buildNotify = (year: number, month: number): Date => {
        const due = new Date(year, month, dom, 9, 0, 0, 0);
        const notify = new Date(due);
        notify.setDate(notify.getDate() - reminderDaysBefore);
        return notify;
      };

      const notify = buildNotify(now.getFullYear(), now.getMonth());
      if (notify > now) return notify;
      return buildNotify(now.getFullYear(), now.getMonth() + 1);
    }

    case "yearly": {
      const dom = options.dayOfMonth ?? 1;
      const moy = (options.monthOfYear ?? 1) - 1; // JS months are 0-indexed

      const buildNotify = (year: number): Date => {
        const due = new Date(year, moy, dom, 9, 0, 0, 0);
        const notify = new Date(due);
        notify.setDate(notify.getDate() - reminderDaysBefore);
        return notify;
      };

      const notify = buildNotify(now.getFullYear());
      if (notify > now) return notify;
      return buildNotify(now.getFullYear() + 1);
    }

    default:
      return null;
  }
}

export function buildNotificationTitle(reminderTitle: string, reminderDaysBefore: number): string {
  const suffix =
    reminderDaysBefore === 0
      ? "DUE TODAY"
      : reminderDaysBefore === 1
        ? "DUE TOMORROW"
        : `DUE IN ${reminderDaysBefore} DAYS`;
  return `${reminderTitle.toUpperCase()} ${suffix}`;
}

export function buildNotificationBody(
  reminderTitle: string,
  reminderDaysBefore: number,
  amount?: string | null
): string {
  const when =
    reminderDaysBefore === 0
      ? "today"
      : reminderDaysBefore === 1
        ? "tomorrow"
        : `in ${reminderDaysBefore} days`;

  const amountPart = amount ? ` of ₹${amount}` : "";
  return `Your ${reminderTitle} payment${amountPart} is due ${when}.`;
}

export const FREQUENCY_LABELS: Record<ReminderFrequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
  one_time: "One-time",
};

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
