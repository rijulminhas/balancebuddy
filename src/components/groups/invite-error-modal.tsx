"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function InviteErrorModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorMessage = searchParams.get("invite_error");
  const [open, setOpen] = useState(!!errorMessage);

  useEffect(() => {
    if (errorMessage) setOpen(true);
  }, [errorMessage]);

  function handleClose() {
    setOpen(false);
    router.replace("/groups");
  }

  if (!errorMessage) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm text-center gap-0 p-8" showCloseButton={false}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black tracking-tight">Unable to Join</h2>
            <p className="text-sm text-muted-foreground">{decodeURIComponent(errorMessage)}</p>
          </div>
          <Button
            variant="outline"
            className="w-full rounded-xl font-bold mt-2"
            onClick={handleClose}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
