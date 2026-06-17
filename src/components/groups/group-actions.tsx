"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LogOut, MoreHorizontal, RotateCcw } from "lucide-react";
import { LeaveGroupModal } from "./leave-group-modal";
import { TransferOwnershipModal, type TransferMember } from "./transfer-ownership-modal";
import { ResetExpensesModal } from "./reset-expenses-modal";

interface GroupActionsProps {
  groupId: string;
  role: string;
  userId: string;
  members: TransferMember[];
}

type ActiveModal = "none" | "create-new-guard" | "leave-confirm" | "transfer-owner" | "reset-expenses";

export function GroupActions({ groupId, role, userId, members }: GroupActionsProps) {
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  const isPrivileged = role === "owner" || role === "admin";

  const hasOtherMembers = members.some((m) => m.userId !== userId);

  function openLeave(destination: string) {
    setRedirectTo(destination);
    if (role === "owner" && hasOtherMembers) {
      setActiveModal("transfer-owner");
    } else {
      setActiveModal("leave-confirm");
    }
  }

  function handleLeaveClick() {
    openLeave("/dashboard");
  }

  function handleCreateNewClick() {
    setActiveModal("create-new-guard");
  }

  function handleCreateNewConfirm() {
    setActiveModal("none");
    openLeave("/groups/create");
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* {isPrivileged && (
            <>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setActiveModal("reset-expenses")}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset expenses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )} */}
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={handleLeaveClick}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Leave group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={activeModal === "create-new-guard"}
        onOpenChange={(v) => { if (!v) setActiveModal("none"); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave your current group first</AlertDialogTitle>
            <AlertDialogDescription>
              You can only be in one group at a time. To create a new group, you
              must leave your current group first.
              {role === "owner" && hasOtherMembers
                ? " As the owner, you will need to transfer ownership to another member before leaving."
                : " You can always rejoin this group later with an invite code."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreateNewConfirm}>
              {role === "owner" && hasOtherMembers ? "Transfer & Leave" : "Leave group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LeaveGroupModal
        groupId={groupId}
        userId={userId}
        open={activeModal === "leave-confirm"}
        onOpenChange={(v) => { if (!v) setActiveModal("none"); }}
        redirectTo={redirectTo}
      />

      <TransferOwnershipModal
        groupId={groupId}
        userId={userId}
        members={members}
        open={activeModal === "transfer-owner"}
        onOpenChange={(v) => { if (!v) setActiveModal("none"); }}
        redirectTo={redirectTo}
      />

      <ResetExpensesModal
        groupId={groupId}
        userId={userId}
        open={activeModal === "reset-expenses"}
        onOpenChange={(v) => { if (!v) setActiveModal("none"); }}
      />
    </>
  );
}
