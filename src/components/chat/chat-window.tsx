"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Send, Loader2, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ResetChatModal } from "./reset-chat-modal";
import type { ChatMessage } from "@/types/chat";

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
  const [isPolling, setIsPolling] = useState(false);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const isPrivileged = userRole === "owner" || userRole === "admin";

  const bottomRef = useRef<HTMLDivElement>(null);
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

  async function handleSend() {
    const content = input.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setInput("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) return;
      const msg = (await res.json()) as ChatMessage;
      setMsgList((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        lastTsRef.current = msg.createdAt;
        return [...prev, msg];
      });
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

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Group Chat</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Chat with your group members
          </p>
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
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-3 shrink-0">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              className="min-h-[40px] max-h-[120px] resize-none text-sm"
              rows={1}
              disabled={isSending}
            />
            <Button
              size="icon"
              disabled={!input.trim() || isSending}
              onClick={() => void handleSend()}
              className="shrink-0 h-10 w-10"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
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
