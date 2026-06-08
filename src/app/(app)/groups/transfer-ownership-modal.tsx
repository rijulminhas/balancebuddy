"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { transferOwnershipAndLeave } from "@/actions/groups";

export interface TransferMember {
  userId: string;
  name: string;
  avatarUrl: string;
}

interface TransferOwnershipModalProps {
  groupId: string;
  userId: string;
  members: TransferMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function TransferOwnershipModal({
  groupId,
  userId,
  members,
  open,
  onOpenChange,
  redirectTo = "/dashboard",
}: TransferOwnershipModalProps) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const eligibleMembers = members.filter((m) => m.userId !== userId);

  function handleClose() {
    if (isTransferring) return;
    setSelectedUserId(null);
    onOpenChange(false);
  }

  async function handleTransferAndLeave() {
    if (!selectedUserId) {
      toast.error("Please select a new owner first.");
      return;
    }
    setIsTransferring(true);
    try {
      const result = await transferOwnershipAndLeave(userId, groupId, selectedUserId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      setSelectedUserId(null);
      toast.success("Ownership transferred. You have left the group.");
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Failed to transfer ownership. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer ownership before leaving</DialogTitle>
          <DialogDescription>
            As the group owner, you must hand over ownership to another member
            before you can leave. Select who should become the new owner.
          </DialogDescription>
        </DialogHeader>

        {eligibleMembers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            There are no other members in the group. Ask someone to join first
            before you can transfer ownership and leave.
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto py-2 pr-1">
            {eligibleMembers.map((member) => {
              const isSelected = selectedUserId === member.userId;
              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => setSelectedUserId(member.userId)}
                  disabled={isTransferring}
                  className={[
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  ].join(" ")}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 font-medium">{member.name}</span>
                  {isSelected && <Crown className="h-4 w-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isTransferring}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleTransferAndLeave}
            disabled={isTransferring || !selectedUserId || eligibleMembers.length === 0}
          >
            {isTransferring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Transfer & Leave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
