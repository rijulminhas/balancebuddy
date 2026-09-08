"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RemoveMemberModal } from "./remove-member-modal";

interface MemberActionsProps {
  groupId: string;
  requesterId: string;
  target: { userId: string; name: string };
}

export function MemberActions({ groupId, requesterId, target }: MemberActionsProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
        title={`Remove ${target.name}`}
      >
        <UserMinus className="h-3.5 w-3.5" />
      </Button>
      <RemoveMemberModal
        groupId={groupId}
        requesterId={requesterId}
        target={target}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
