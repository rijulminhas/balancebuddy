export type MessageType = "text" | "image";

export interface ChatMessage {
  id: string;
  senderId: string | null;
  senderName: string | null;
  content: string;
  type: MessageType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
