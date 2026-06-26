"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Loader2,
  MessageSquare,
  Trash2,
  ImagePlus,
  Clock3,
  X,
  CornerDownLeft,
  Wifi,
  WifiOff,
} from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ResetChatModal } from "./reset-chat-modal";
import { EmojiPickerButton } from "./emoji-picker";
import { GifPickerButton } from "./gif-picker";
import type { ChatMessage, MessageType, ReactionGroup } from "@/types/chat";
import { useSocketChat } from "@/hooks/use-socket-chat";

interface ChatWindowProps {
  initialMessages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  hasMoreInitial: boolean;
  groupId: string;
  userRole: "owner" | "admin" | "member";
  isSuperAdmin?: boolean;
}

export function ChatWindow({
  initialMessages,
  currentUserId,
  currentUserName,
  hasMoreInitial,
  groupId,
  userRole,
  isSuperAdmin = false,
}: ChatWindowProps) {
  const [msgList, setMsgList] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{
    url: string;
    type: "image" | "gif";
  } | null>(null);
  const [hasMore, setHasMore] = useState(hasMoreInitial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isPrivileged = isSuperAdmin || userRole === "owner" || userRole === "admin";
  const isBusy = isSending || isUploading;

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const { connected, onlineUsers, typingUsers, sendMessage, deleteMessage, reactMessage, sendTyping } = useSocketChat({
    onNewMessage: (msg) => {
      setMsgList((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
    onMessageDeleted: (messageId) => {
      setMsgList((prev) => prev.filter((m) => m.id !== messageId));
    },
    onReactionsUpdated: ({ messageId, reactions }: { messageId: string; reactions: ReactionGroup[] }) => {
      setMsgList((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)),
      );
    },
    onChatReset: () => {
      setMsgList([]);
      setHasMore(false);
    },
  }, groupId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgList.length]);

  async function loadOlder() {
    if (!msgList.length || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const cursor = msgList[0].createdAt;
      const res = await fetch(`/api/chat?cursor=${encodeURIComponent(cursor)}&groupId=${encodeURIComponent(groupId)}`);
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

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 2000);
  }

  async function handleSend() {
    if (isBusy) return;
    // Stop typing indicator immediately on send
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTypingRef.current) { isTypingRef.current = false; sendTyping(false); }
    setIsSending(true);
    try {
      if (pendingMedia) {
        const res = await sendMessage({
          content: pendingMedia.url,
          type: "image",
          metadata: pendingMedia.type === "gif" ? { isGif: true } : null,
          replyToId: replyTo?.id ?? null,
        });
        if (!res.ok) throw new Error(res.error ?? "Send failed");
        setPendingMedia(null);
      } else {
        const content = input.trim();
        if (!content) return;
        setInput("");
        const res = await sendMessage({ content, type: "text", replyToId: replyTo?.id ?? null });
        if (!res.ok) {
          toast.error("Failed to send message.");
          setInput(content);
          return;
        }
      }
      setReplyTo(null);
    } catch {
      toast.error("Failed to send.");
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
    if (e.key === "Escape" && replyTo) setReplyTo(null);
  }

  function handleEmojiSelect(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) { setInput((prev) => prev + emoji); return; }
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
    const res = await deleteMessage(messageId);
    if (!res.ok) toast.error("Failed to delete message.");
    else toast.success("Message deleted successfully.");
  }

  async function handleReact(messageId: string, emoji: string) {
    // Optimistic update
    setMsgList((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.emoji === emoji);
        const alreadyReacted = existing?.userIds.includes(currentUserId);

        if (alreadyReacted) {
          return {
            ...m,
            reactions: m.reactions
              .map((r) =>
                r.emoji === emoji
                  ? { ...r, count: r.count - 1, userIds: r.userIds.filter((id) => id !== currentUserId), userNames: r.userNames.filter((_, i) => r.userIds[i] !== currentUserId) }
                  : r,
              )
              .filter((r) => r.count > 0),
          };
        }
        if (existing) {
          return {
            ...m,
            reactions: m.reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, userIds: [...r.userIds, currentUserId], userNames: [...r.userNames, currentUserName] }
                : r,
            ),
          };
        }
        return { ...m, reactions: [...m.reactions, { emoji, count: 1, userIds: [currentUserId], userNames: [currentUserName] }] };
      }),
    );

    const res = await reactMessage(messageId, emoji);
    // server will emit reactions_updated which will reconcile the state
    if (!res.ok) toast.error("Failed to react.");
  }

  function handleReply(message: ChatMessage) {
    setReplyTo(message);
    textareaRef.current?.focus();
  }

  function handleGifSelect(url: string) {
    if (isBusy) return;
    setPendingMedia({ url, type: "gif" });
  }

  async function uploadImageFile(file: File) {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
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

      if (res.status === 413) { toast.error("Image is too large. Please use an image under 5 MB."); return; }

      let data: { url?: string; error?: string } = {};
      try { data = await res.json(); } catch { toast.error("Failed to upload image."); return; }

      if (!res.ok) { toast.error(data.error ?? "Failed to upload image."); return; }
      setPendingMedia({ url: data.url!, type: "image" });
    } catch {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await uploadImageFile(file);
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(e.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    await uploadImageFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    const hasImage = Array.from(e.dataTransfer.items).some((item) => item.type.startsWith("image/"));
    if (!hasImage) return;
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    await uploadImageFile(file);
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
          {/* Online users */}
          {onlineUsers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5">
                {onlineUsers.slice(0, 4).map((u) => (
                  <div key={u.userId} className="relative" title={u.name ?? "Online"}>
                    <Avatar className="h-6 w-6 ring-2 ring-background">
                      {u.picture && <AvatarImage src={u.picture} alt={u.name ?? ""} />}
                      <AvatarFallback className="text-[9px] font-bold bg-muted">
                        {u.name ? u.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-1 ring-background" />
                  </div>
                ))}
              </div>
              {onlineUsers.length > 4 && (
                <span className="text-[10px] text-muted-foreground">+{onlineUsers.length - 4}</span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {onlineUsers.length === 1 ? "1 online" : `${onlineUsers.length} online`}
              </span>
            </div>
          )}
          {connected ? (
            <span title="Live"><Wifi className="h-3.5 w-3.5 text-green-500" /></span>
          ) : (
            <span title="Connecting…"><WifiOff className="h-3.5 w-3.5 text-muted-foreground animate-pulse" /></span>
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

      <Card
        className="relative flex flex-col flex-1 min-h-0 overflow-hidden"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={(e) => void handleDrop(e)}
      >
        {isDragging && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background/80 backdrop-blur-sm pointer-events-none">
            <ImagePlus className="h-10 w-10 text-primary" />
            <p className="text-sm font-medium text-primary">Drop image to upload</p>
          </div>
        )}
        {hasMore && (
          <div className="flex justify-center py-2 border-b shrink-0">
            <Button variant="ghost" size="sm" className="text-xs" disabled={isLoadingMore} onClick={loadOlder}>
              {isLoadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Load older messages
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {msgList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 text-center">
              <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to say hello!</p>
            </div>
          ) : (
            msgList.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
                currentUserId={currentUserId}
                canDelete={msg.senderId === currentUserId || isPrivileged}
                onDelete={
                  msg.senderId === currentUserId || isPrivileged
                    ? () => void handleDeleteMessage(msg.id)
                    : undefined
                }
                onReply={handleReply}
                onReact={handleReact}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t px-3 py-2.5 shrink-0">
          {/* Typing indicator */}
          {typingUsers.filter((u) => u.userId !== currentUserId).length > 0 && (
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              <div className="flex gap-0.5 items-end">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-[11px] text-muted-foreground italic">
                {(() => {
                  const others = typingUsers.filter((u) => u.userId !== currentUserId);
                  if (others.length === 1) return `${others[0].name ?? "Someone"} is typing…`;
                  if (others.length === 2) return `${others[0].name ?? "Someone"} and ${others[1].name ?? "someone"} are typing…`;
                  return `${others.length} people are typing…`;
                })()}
              </span>
            </div>
          )}
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-muted/60 border border-border">
              <CornerDownLeft className="h-3.5 w-3.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-primary truncate">
                  Replying to {replyTo.senderName ?? "Unknown"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {replyTo.type === "image" ? "📷 Image" : replyTo.content}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                aria-label="Cancel reply"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {pendingMedia && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <img src={pendingMedia.url} alt="pending" className="h-16 w-16 rounded-md object-cover border" />
              <button onClick={() => setPendingMedia(null)} className="text-xs text-muted-foreground hover:text-destructive">
                ✕ Remove
              </button>
            </div>
          )}

          <div className="flex items-end gap-1 rounded-xl border bg-muted/40 px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring transition-shadow">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => handleInputChange(e)}
              onKeyDown={handleKeyDown}
              onPaste={(e) => void handlePaste(e)}
              placeholder={replyTo ? "Write a reply…" : "Type a message…"}
              className="flex-1 min-h-[36px] max-h-[120px] resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm py-1.5 px-1 placeholder:text-muted-foreground"
              rows={1}
              disabled={isBusy}
            />

            <EmojiPickerButton onEmojiSelect={handleEmojiSelect} disabled={isBusy} />
            <GifPickerButton onGifSelect={handleGifSelect} disabled={isBusy} />
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
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              disabled={(!input.trim() && !pendingMedia) || isBusy}
              onClick={() => void handleSend()}
              className="h-8 w-8 shrink-0 rounded-lg"
            >
              {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
            Enter to send · Shift+Enter for new line · Ctrl+V to paste image
            {replyTo && " · Esc to cancel reply"}
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
          }}
        />
      )}
    </div>
  );
}
