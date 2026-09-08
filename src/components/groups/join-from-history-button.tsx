"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { switchGroup } from "@/actions/groups";

interface JoinFromHistoryButtonProps {
  inviteCode: string;
}

export function JoinFromHistoryButton({ inviteCode }: JoinFromHistoryButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleJoin() {
    if (!session?.user?.id) return;
    setIsLoading(true);
    try {
      const result = await switchGroup(session.user.id, { inviteCode });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Joined group successfully!");
      router.push("/groups");
      router.refresh();
    } catch {
      toast.error("Failed to join group. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handleJoin} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogIn className="mr-1.5 h-3.5 w-3.5" />
      )}
      Join
    </Button>
  );
}
