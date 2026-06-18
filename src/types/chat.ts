export interface ChatMessage {
  id: string;
  senderId: string | null;
  senderName: string | null;
  content: string;
  createdAt: string;
}
