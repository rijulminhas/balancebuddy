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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { removeMember } from "@/actions/groups";

const DEFAULT_REASON = "Left the group";

interface RemoveMemberModalProps {
  groupId: string;
  requesterId: string;
  target: { userId: string; name: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RemoveMemberModal({
  groupId,
  requesterId,
  target,
  open,
  onOpenChange,
}: RemoveMemberModalProps) {
  const router = useRouter();
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [isRemoving, setIsRemoving] = useState(false);

  function handleClose() {
    if (isRemoving) return;
    setReason(DEFAULT_REASON);
    onOpenChange(false);
  }

  async function handleRemove() {
    setIsRemoving(true);
    try {
      const result = await removeMember(
        requesterId,
        groupId,
        target.userId,
        reason.trim() || DEFAULT_REASON
      );
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      onOpenChange(false);
      setReason(DEFAULT_REASON);
      toast.success(`${target.name} has been removed from the group.`);
      router.refresh();
    } catch {
      toast.error("Failed to remove member. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove {target.name}?</DialogTitle>
          <DialogDescription>
            {target.name} will be removed from the group and notified. All
            group members will also be informed. They can rejoin with an invite
            code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Label htmlFor="remove-reason">Reason</Label>
          <Textarea
            id="remove-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={DEFAULT_REASON}
            className="resize-none"
            rows={3}
            disabled={isRemoving}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground">
            This reason will be visible to all members in the notification.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isRemoving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remove member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
