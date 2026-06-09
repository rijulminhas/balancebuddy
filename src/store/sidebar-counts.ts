import { create } from "zustand";

interface SidebarCountsState {
  unreadCount: number;
  historyCount: number;
  setCounts: (unread: number, history: number) => void;
}

export const useSidebarCounts = create<SidebarCountsState>((set) => ({
  unreadCount: 0,
  historyCount: 0,
  setCounts: (unread, history) => set({ unreadCount: unread, historyCount: history }),
}));
