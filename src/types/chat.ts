export type MessageType = "text" | "image";

export interface ReactionGroup {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ReplyPreview {
  id: string;
  senderName: string | null;
  content: string;
  type: MessageType;
  isDeleted: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string | null;
  senderName: string | null;
  senderImage: string | null;
  content: string;
  type: MessageType;
  metadata: Record<string, unknown> | null;
  replyToId: string | null;
  replyTo: ReplyPreview | null;
  reactions: ReactionGroup[];
  createdAt: string;
}
