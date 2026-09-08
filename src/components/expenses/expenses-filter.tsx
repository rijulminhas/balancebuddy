"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpensesFilterProps {
  currentStatus: string;
}

export function ExpensesFilter({ currentStatus }: ExpensesFilterProps) {
  const router = useRouter();

  function handleStatusChange(value: string) {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  return (
    <Select value={currentStatus} onValueChange={handleStatusChange}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue placeholder="Filter by status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="pending">Pending</SelectItem>
        <SelectItem value="settled">Settled</SelectItem>
      </SelectContent>
    </Select>
  );
}
