"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";

export function JoinSuccessModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const groupName = searchParams.get("joined");
  const [open, setOpen] = useState(!!groupName);

  useEffect(() => {
    if (groupName) setOpen(true);
  }, [groupName]);

  function handleClose() {
    setOpen(false);
    router.replace("/groups");
  }

  if (!groupName) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm text-center gap-0 p-8" showCloseButton={false}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black tracking-tight">Congratulations! 🎉</h2>
            <p className="text-sm text-muted-foreground">
              You are now a member of{" "}
              <span className="font-semibold text-foreground">{groupName}</span>
            </p>
          </div>
          <Button className="w-full rounded-xl font-bold mt-2" onClick={handleClose}>
            Let&apos;s go!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
