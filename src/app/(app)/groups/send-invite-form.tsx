"use client";

import { useState } from "react";
import { Send, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendGroupInvite } from "@/actions/groups";

export function SendInviteForm({ groupId }: { groupId: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const result = await sendGroupInvite(groupId, email.trim());
      if (!result.success) {
        toast.error(result.error ?? "Failed to send invite");
        return;
      }
      setSent(true);
      setEmail("");
      toast.success(`Invite sent to ${email.trim()}`);
      setTimeout(() => setSent(false), 3000);
    } catch {
      toast.error("Failed to send invite. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Send invite via email</p>
      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="friend@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="h-9 text-sm rounded-lg"
          disabled={loading}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={loading || !email.trim()}
          className="h-9 gap-1.5 rounded-lg shrink-0"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : sent ? (
            <><Check className="h-3.5 w-3.5" /> Sent!</>
          ) : (
            <><Send className="h-3.5 w-3.5" /> Send</>
          )}
        </Button>
      </div>
    </div>
  );
}
