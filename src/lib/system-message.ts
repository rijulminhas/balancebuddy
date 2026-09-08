import { db } from "@/db";
import { messages } from "@/db/schema";

type SystemMessageType = "system" | "expense_update" | "chore_update" | "settlement_update";

export async function insertSystemMessage(
  groupId: string,
  type: SystemMessageType,
  content: string
): Promise<void> {
  await db.insert(messages).values({
    groupId,
    senderId: null,
    type,
    content,
  });
}
