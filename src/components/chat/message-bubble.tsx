"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Reply, SmilePlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ChatMessage, ReactionGroup } from "@/types/chat";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function MessageContent({ message }: { message: ChatMessage }) {
  if (message.type === "image") {
    return (
      <img
        src={message.content}
        alt="image"
        loading="lazy"
        className="max-w-60 rounded-xl object-cover shadow-sm cursor-pointer"
        onClick={() => window.open(message.content, "_blank")}
      />
    );
  }
  return (
    <span className="whitespace-pre-wrap wrap-break-word">{message.content}</span>
  );
}

function ReplyPreviewBubble({
  replyTo,
  isOwn,
}: {
  replyTo: NonNullable<ChatMessage["replyTo"]>;
  isOwn: boolean;
}) {
  const previewText = replyTo.isDeleted
    ? "Message deleted"
    : replyTo.type === "image"
      ? "📷 Image"
      : replyTo.content.slice(0, 80);

  return (
    <div
      className={cn(
        "rounded-lg border-l-[3px] px-2.5 py-1.5 mb-1 text-xs max-w-full truncate",
        isOwn
          ? "border-primary-foreground/50 bg-primary/70 text-primary-foreground/80"
          : "border-primary/50 bg-muted text-muted-foreground",
      )}
    >
      <p className="font-semibold truncate mb-0.5">
        {replyTo.senderName ?? "Unknown"}
      </p>
      <p className="truncate opacity-80">{previewText}</p>
    </div>
  );
}

function ReactionsDisplay({
  reactions,
  currentUserId,
  messageId,
  onReact,
}: {
  reactions: ReactionGroup[];
  currentUserId: string;
  messageId: string;
  onReact: (messageId: string, emoji: string) => void;
}) {
  if (!reactions.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((r) => {
        const isOwn = r.userIds.includes(currentUserId);
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onReact(messageId, r.emoji)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors",
              isOwn
                ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                : "border-border bg-background hover:bg-muted text-foreground",
            )}
          >
            <span>{r.emoji}</span>
            <span>{r.count}</span>
          </button>
        );
      })}
    </div>
  );
}

function ReactionPickerButton({
  messageId,
  onReact,
}: {
  messageId: string;
  onReact: (messageId: string, emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="React to message"
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-1.5"
        side="top"
        align="center"
        sideOffset={6}
      >
        <div className="flex gap-0.5">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(messageId, emoji);
                setOpen(false);
              }}
              className="text-lg p-1 rounded-md hover:bg-muted transition-transform hover:scale-125"
              aria-label={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  currentUserId: string;
  canDelete?: boolean;
  onDelete?: () => void;
  onReply?: (message: ChatMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  canDelete,
  onDelete,
  onReply,
  onReact,
}: MessageBubbleProps) {
  const [confirming, setConfirming] = useState(false);
  const time = format(new Date(message.createdAt), "hh:mm a");
  const name = message.senderName ?? "Unknown";
  const isImage = message.type === "image";

  const handleReact = onReact
    ? (messageId: string, emoji: string) => onReact(messageId, emoji)
    : undefined;

  const ActionBar = (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0 self-center">
      {onReply && (
        <button
          type="button"
          onClick={() => onReply(message)}
          className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Reply"
        >
          <Reply className="h-3.5 w-3.5" />
        </button>
      )}
      {handleReact && (
        <ReactionPickerButton messageId={message.id} onReact={handleReact} />
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="p-1 rounded-full hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          aria-label="Delete message"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const DeleteDialog = (
    <Dialog open={confirming} onOpenChange={setConfirming}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            Delete message
          </DialogTitle>
          <DialogDescription>
            This message will be permanently deleted. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setConfirming(false);
              onDelete?.();
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (isOwn) {
    return (
      <>
        <div className="group flex justify-end">
          <div className="flex flex-col items-end gap-0.5 max-w-[75%]">
            {message.replyTo && (
              <ReplyPreviewBubble replyTo={message.replyTo} isOwn={true} />
            )}
            <div className="flex items-end gap-1.5">
              {ActionBar}
              {isImage ? (
                <MessageContent message={message} />
              ) : (
                <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm shadow-sm">
                  <MessageContent message={message} />
                </div>
              )}
            </div>
            {message.reactions.length > 0 && handleReact && (
              <ReactionsDisplay
                reactions={message.reactions}
                currentUserId={currentUserId}
                messageId={message.id}
                onReact={handleReact}
              />
            )}
            <span className="text-[10px] text-muted-foreground px-1">
              {time}
            </span>
          </div>
        </div>
        {DeleteDialog}
      </>
    );
  }

  return (
    <>
      <div className="group flex items-end gap-2">
        <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border">
          {message.senderImage && (
            <AvatarImage src={message.senderImage} alt={name} />
          )}
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5 max-w-[75%]">
          <span className="text-[11px] font-semibold text-muted-foreground px-1">
            {name}
          </span>
          {message.replyTo && (
            <ReplyPreviewBubble replyTo={message.replyTo} isOwn={false} />
          )}
          <div className="flex items-end gap-1.5">
            {isImage ? (
              <MessageContent message={message} />
            ) : (
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm shadow-sm">
                <MessageContent message={message} />
              </div>
            )}
            {ActionBar}
          </div>
          {message.reactions.length > 0 && handleReact && (
            <ReactionsDisplay
              reactions={message.reactions}
              currentUserId={currentUserId}
              messageId={message.id}
              onReact={handleReact}
            />
          )}
          <span className="text-[10px] text-muted-foreground px-1">{time}</span>
        </div>
      </div>
      {DeleteDialog}
    </>
  );
}
