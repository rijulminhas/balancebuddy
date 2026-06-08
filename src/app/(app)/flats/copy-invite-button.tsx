"use client";

import { useState } from "react";
import { Copy, Check, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = inviteUrl;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    toast.success("Invite link copied!");
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 rounded-lg h-8 text-xs font-medium"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <LinkIcon className="h-3.5 w-3.5" />
          Copy invite link
        </>
      )}
    </Button>
  );
}

export function CopyInviteCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="gap-1.5 rounded-lg h-8 text-xs font-medium"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-500" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy code
        </>
      )}
    </Button>
  );
}
