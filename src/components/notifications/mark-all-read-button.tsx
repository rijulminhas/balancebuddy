"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markNotificationsRead } from "@/actions/notifications";

interface MarkAllReadButtonProps {
  userId: string;
}

export function MarkAllReadButton({ userId }: MarkAllReadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleMarkAll() {
    setLoading(true);
    try {
      const result = await markNotificationsRead(userId);
      if (!result.success) toast.error("Failed to mark notifications as read");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="rounded-xl font-semibold"
      onClick={handleMarkAll}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Check className="mr-2 h-4 w-4" />
      )}
      Mark all read
    </Button>
  );
}
