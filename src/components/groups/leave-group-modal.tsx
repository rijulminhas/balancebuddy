"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { leaveGroup } from "@/actions/groups";

interface LeaveGroupModalProps {
  groupId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}

export function LeaveGroupModal({
  groupId,
  userId,
  open,
  onOpenChange,
  redirectTo = "/dashboard",
}: LeaveGroupModalProps) {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function handleLeave() {
    setIsLeaving(true);
    try {
      const result = await leaveGroup(userId, groupId);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      toast.success("You have left the group.");
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Failed to leave group. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isLeaving) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Leave this group?</DialogTitle>
          <DialogDescription>
            You will lose access to all shared data in this group. You can
            rejoin later with an invite code.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLeaving}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Leave group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
