"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Send,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
  ImagePlus,
  Clock3,
} from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ResetChatModal } from "./reset-chat-modal";
import { EmojiPickerButton } from "./emoji-picker";
import { GifPickerButton } from "./gif-picker";
import type { ChatMessage, MessageType } from "@/types/chat";

const POLL_MS = 5000;

interface ChatWindowProps {
  initialMessages: ChatMessage[];
  currentUserId: string;
  hasMoreInitial: boolean;
  groupId: string;
  userRole: "owner" | "admin" | "member";
}

export function ChatWindow({
  initialMessages,
  currentUserId,
  hasMoreInitial,
  groupId,
  userRole,
}: ChatWindowProps) {
  const [msgList, setMsgList] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const isPrivileged = userRole === "owner" || userRole === "admin";
  const isBusy = isSending || isUploading;

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastTsRef = useRef<string>(
    initialMessages.at(-1)?.createdAt ?? new Date(0).toISOString(),
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgList.length]);

  const poll = useCallback(async () => {
    setIsPolling(true);
    try {
      const res = await fetch(
        `/api/chat/poll?since=${encodeURIComponent(lastTsRef.current)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      if (!data.messages.length) return;
      setMsgList((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const fresh = data.messages.filter((m) => !seen.has(m.id));
        if (!fresh.length) return prev;
        lastTsRef.current = fresh.at(-1)!.createdAt;
        return [...prev, ...fresh];
      });
    } finally {
      setIsPolling(false);
    }
  }, []);

  useEffect(() => {
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [poll]);

  async function loadOlder() {
    if (!msgList.length || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const cursor = msgList[0].createdAt;
      const res = await fetch(`/api/chat?cursor=${encodeURIComponent(cursor)}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: ChatMessage[];
        hasMore: boolean;
      };
      setHasMore(data.hasMore);
      setMsgList((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...data.messages.filter((m) => !seen.has(m.id)), ...prev];
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function sendMessage(
    type: MessageType,
    content: string,
    metadata?: Record<string, unknown> | null,
  ) {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type, metadata: metadata ?? null }),
    });
    if (!res.ok) throw new Error("Send failed");
    const msg = (await res.json()) as ChatMessage;
    setMsgList((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      lastTsRef.current = msg.createdAt;
      return [...prev, msg];
    });
  }

  async function handleSend() {
    const content = input.trim();
    if (!content || isBusy) return;
    setIsSending(true);
    setInput("");
    try {
      await sendMessage("text", content);
    } catch {
      toast.error("Failed to send message.");
      setInput(content);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleEmojiSelect(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setInput((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = input.slice(0, start) + emoji + input.slice(end);
    setInput(next);
    setTimeout(() => {
      textarea.selectionStart = start + emoji.length;
      textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  }

  async function handleDeleteMessage(messageId: string) {
    const res = await fetch(`/api/chat/${messageId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete message.");
      return;
    }
    setMsgList((prev) => prev.filter((m) => m.id !== messageId));
  }

  async function handleGifSelect(url: string) {
    if (isBusy) return;
    setIsUploading(true);
    try {
      await sendMessage("image", url, { isGif: true });
    } catch {
      toast.error("Failed to send GIF.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type,
      )
    ) {
      toast.error("Only JPEG, PNG, WebP and GIF images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large. Please use an image under 5 MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/chat/upload", { method: "POST", body: fd });

      if (res.status === 413) {
        toast.error("Image is too large. Please use an image under 5 MB.");
        return;
      }

      let data: { url?: string; error?: string } = {};
      try {
        data = await res.json();
      } catch {
        toast.error("Failed to upload image. Please try again.");
        return;
      }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to upload image.");
        return;
      }
      await sendMessage("image", data.url!);
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(95vh-6rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Group Chat</h1>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <p className="text-xs text-muted-foreground">
              Chat with your group members
            </p>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
              <Clock3 className="h-3 w-3" />
              Chat messages are automatically deleted after 24 hours
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPolling && (
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
          )}
          {isPrivileged && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs"
              onClick={() => setShowResetModal(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Reset chat
            </Button>
          )}
        </div>
      </div>

      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {hasMore && (
          <div className="flex justify-center py-2 border-b shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={isLoadingMore}
              onClick={loadOlder}
            >
              {isLoadingMore && (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              )}
              Load older messages
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {msgList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                No messages yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Be the first to say hello!
              </p>
            </div>
          ) : (
            msgList.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
                onDelete={
                  msg.senderId === currentUserId
                    ? () => void handleDeleteMessage(msg.id)
                    : undefined
                }
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t px-3 py-2.5 shrink-0">
          <div className="flex items-end gap-1 rounded-xl border bg-muted/40 px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring transition-shadow">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="flex-1 min-h-[36px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm py-1.5 px-1 placeholder:text-muted-foreground"
              rows={1}
              disabled={isBusy}
            />

            <EmojiPickerButton
              onEmojiSelect={handleEmojiSelect}
              disabled={isBusy}
            />
            <GifPickerButton
              onGifSelect={(url) => void handleGifSelect(url)}
              disabled={isBusy}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void handleImageSelect(e)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              disabled={isBusy}
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              disabled={!input.trim() || isBusy}
              onClick={() => void handleSend()}
              className="h-8 w-8 shrink-0 rounded-lg"
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </Card>

      {isPrivileged && (
        <ResetChatModal
          groupId={groupId}
          userId={currentUserId}
          open={showResetModal}
          onOpenChange={setShowResetModal}
          onSuccess={() => {
            setMsgList([]);
            setHasMore(false);
            lastTsRef.current = new Date().toISOString();
          }}
        />
      )}
    </div>
  );
}
