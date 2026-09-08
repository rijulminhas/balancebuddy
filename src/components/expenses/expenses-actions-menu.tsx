"use client";

import { useState } from "react";
import { MoreHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ResetExpensesModal } from "@/components/groups/reset-expenses-modal";

interface ExpensesActionsMenuProps {
  groupId: string;
  userId: string;
}

export function ExpensesActionsMenu({ groupId, userId }: ExpensesActionsMenuProps) {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="lg" className="px-3">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setResetOpen(true)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset expenses
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ResetExpensesModal
        groupId={groupId}
        userId={userId}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />
    </>
  );
}
