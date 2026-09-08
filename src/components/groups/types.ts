export interface GroupMemberItem {
  id: string;
  userId: string;
  role: string;
  joinedAt: Date;
  name: string;
  email: string;
  image: string | null;
}
