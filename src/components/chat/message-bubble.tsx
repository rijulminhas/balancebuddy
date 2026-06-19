import { useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatMessage } from "@/types/chat";

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
        className="max-w-[240px] rounded-xl object-cover shadow-sm cursor-pointer"
        onClick={() => window.open(message.content, "_blank")}
      />
    );
  }
  return (
    <span className="whitespace-pre-wrap break-words">{message.content}</span>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  canDelete?: boolean;
  onDelete?: () => void;
}

export function MessageBubble({ message, isOwn, canDelete, onDelete }: MessageBubbleProps) {
  const [confirming, setConfirming] = useState(false);
  const time = format(new Date(message.createdAt), "hh:mm a");
  const name = message.senderName ?? "Unknown";
  const isImage = message.type === "image";

  if (isOwn) {
    return (
      <>
        <div className="group flex justify-end">
          <div className="flex flex-col items-end gap-1 max-w-[75%]">
            <div className="flex items-end gap-1.5">
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 self-center"
                aria-label="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </button>
              {isImage ? (
                <MessageContent message={message} />
              ) : (
                <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm shadow-sm">
                  <MessageContent message={message} />
                </div>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground px-1">{time}</span>
          </div>
        </div>

        <Dialog open={confirming} onOpenChange={setConfirming}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-destructive" />
                Delete message
              </DialogTitle>
              <DialogDescription>
                This message will be permanently deleted. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => { setConfirming(false); onDelete?.(); }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className="group flex items-end gap-2">
        <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border">
          <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 max-w-[75%]">
          <span className="text-[11px] font-semibold text-muted-foreground px-1">
            {name}
          </span>
          <div className="flex items-end gap-1.5">
            {isImage ? (
              <MessageContent message={message} />
            ) : (
              <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm shadow-sm">
                <MessageContent message={message} />
              </div>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive shrink-0 self-center"
                aria-label="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground px-1">{time}</span>
        </div>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-destructive" />
              Delete message
            </DialogTitle>
            <DialogDescription>
              This message will be permanently deleted. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { setConfirming(false); onDelete?.(); }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
