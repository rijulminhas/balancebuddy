"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, LogOut, Settings } from "lucide-react";
import { leaveFlat } from "@/actions/flats";

interface FlatActionsProps {
  flatId: string;
  role: string;
  userId: string;
}

export function FlatActions({ flatId, role, userId }: FlatActionsProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function handleLeave() {
    if (!confirm("Are you sure you want to leave this flat?")) return;
    setIsLeaving(true);
    try {
      const result = await leaveFlat(userId, flatId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("You have left the flat.");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Failed to leave flat.");
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(role === "owner" || role === "admin") && (
          <>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Flat settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        {role !== "owner" && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave flat
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
