"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resetGroupChat } from "@/actions/messages";

interface ResetChatModalProps {
  groupId: string;
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ResetChatModal({
  groupId,
  userId,
  open,
  onOpenChange,
  onSuccess,
}: ResetChatModalProps) {
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await resetGroupChat(userId, groupId);
      if (result.success) {
        toast.success("Chat history has been cleared.");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Failed to reset chat.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isPending) onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Reset group chat
          </DialogTitle>
          <DialogDescription>
            This will permanently delete all chat messages and remove
            chat notifications for every group member. This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Clearing…" : "Clear chat history"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
