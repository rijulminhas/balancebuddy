export interface ExpenseParticipant {
  userId: string;
  name: string;
  shareAmount: string;
  sharePercentage: string | null;
  isPaid: boolean;
}

export interface ExpenseDetail {
  id: string;
  title: string;
  amount: string;
  category: string;
  splitType: string;
  date: string;
  isSettled: boolean;
  description: string | null;
  paidById: string;
  paidByName: string;
  receiptUrls: string[] | null;
  participants: ExpenseParticipant[];
}

export interface GroupMember {
  userId: string;
  name: string;
}
