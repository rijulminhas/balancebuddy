import { create } from "zustand";

interface SidebarCountsState {
  unreadCount: number;
  historyCount: number;
  unreadChat: number;
  setCounts: (unread: number, history: number, unreadChat: number) => void;
}

export const useSidebarCounts = create<SidebarCountsState>((set) => ({
  unreadCount: 0,
  historyCount: 0,
  unreadChat: 0,
  setCounts: (unread, history, unreadChat) =>
    set({ unreadCount: unread, historyCount: history, unreadChat }),
}));
