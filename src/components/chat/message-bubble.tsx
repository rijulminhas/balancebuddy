import { format } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = format(new Date(message.createdAt), "hh:mm a");
  const name = message.senderName ?? "Unknown";

  if (isOwn) {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm">
            {message.content}
          </div>
          <span className="text-[10px] text-muted-foreground px-1">{time}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end gap-2">
      <Avatar className="h-7 w-7 shrink-0 ring-1 ring-border">
        <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1 max-w-[75%]">
        <span className="text-[11px] font-semibold text-muted-foreground px-1">{name}</span>
        <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm">
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">{time}</span>
      </div>
    </div>
  );
}
