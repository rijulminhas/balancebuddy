"use client";

import { useRouter } from "next/navigation";
import { format, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentHistoryFilterProps {
  currentStatus: string;
  currentMonth: string;
}

const MONTHS_TO_SHOW = 12;

export function PaymentHistoryFilter({
  currentStatus,
  currentMonth,
}: PaymentHistoryFilterProps) {
  const router = useRouter();

  const months = Array.from({ length: MONTHS_TO_SHOW }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, "yyyy-MM"), label: format(d, "MMM yyyy") };
  });

  function updateFilter(
    key: "historyStatus" | "historyMonth",
    value: string,
  ) {
    const params = new URLSearchParams();
    const newStatus = key === "historyStatus" ? value : currentStatus;
    const newMonth = key === "historyMonth" ? value : currentMonth;
    if (newStatus && newStatus !== "all") params.set("historyStatus", newStatus);
    if (newMonth && newMonth !== "all") params.set("historyMonth", newMonth);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select
        value={currentStatus}
        onValueChange={(v) => updateFilter("historyStatus", v)}
      >
        <SelectTrigger className="w-[160px] h-8 text-xs">
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="completed">Settled / Completed</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={currentMonth}
        onValueChange={(v) => updateFilter("historyMonth", v)}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Filter by month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All months</SelectItem>
          {months.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
