"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage, ReactionGroup } from "@/types/chat";
import { getWsToken } from "@/actions/ws-token";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

export interface OnlineUser {
  userId: string;
  name: string | null;
  picture: string | null;
}

export interface TypingUser {
  userId: string;
  name: string | null;
}

interface SocketChatHandlers {
  onNewMessage: (msg: ChatMessage) => void;
  onMessageDeleted: (messageId: string) => void;
  onReactionsUpdated: (data: { messageId: string; reactions: ReactionGroup[] }) => void;
  onChatReset?: () => void;
}

export function useSocketChat(handlers: SocketChatHandlers, groupId: string) {
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef(handlers);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    let socket: Socket;

    async function connect() {
      const token = await getWsToken(groupId);
      if (!token) return;

      socket = io(WS_URL, {
        auth: { token },
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => {
        setConnected(false);
        setOnlineUsers([]);
        setTypingUsers([]);
      });

      socket.on("new_message", (msg: ChatMessage) => {
        handlersRef.current.onNewMessage(msg);
      });

      socket.on("message_deleted", (messageId: string) => {
        handlersRef.current.onMessageDeleted(messageId);
      });

      socket.on("reactions_updated", (data: { messageId: string; reactions: ReactionGroup[] }) => {
        handlersRef.current.onReactionsUpdated(data);
      });

      socket.on("chat_reset", () => {
        handlersRef.current.onChatReset?.();
      });

      socket.on("presence_update", (users: OnlineUser[]) => {
        setOnlineUsers(users);
      });

      socket.on("user_typing", (user: TypingUser) => {
        setTypingUsers((prev) =>
          prev.some((u) => u.userId === user.userId) ? prev : [...prev, user],
        );
      });

      socket.on("user_stop_typing", ({ userId }: { userId: string }) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      });

      socketRef.current = socket;
    }

    void connect();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
      setOnlineUsers([]);
      setTypingUsers([]);
    };
  }, [groupId]);

  const sendMessage = useCallback(
    (
      data: {
        content: string;
        type: "text" | "image";
        metadata?: Record<string, unknown> | null;
        replyToId?: string | null;
      },
    ): Promise<{ ok: boolean; message?: ChatMessage; error?: string }> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ ok: false, error: "Not connected" });
          return;
        }
        socketRef.current.emit("send_message", data, resolve);
      });
    },
    [],
  );

  const deleteMessage = useCallback((messageId: string): Promise<{ ok: boolean }> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve({ ok: false });
        return;
      }
      socketRef.current.emit("delete_message", messageId, resolve);
    });
  }, []);

  const reactMessage = useCallback(
    (messageId: string, emoji: string): Promise<{ ok: boolean }> => {
      return new Promise((resolve) => {
        if (!socketRef.current?.connected) {
          resolve({ ok: false });
          return;
        }
        socketRef.current.emit("react_message", { messageId, emoji }, resolve);
      });
    },
    [],
  );

  const sendTyping = useCallback((isTyping: boolean) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit(isTyping ? "typing_start" : "typing_stop");
  }, []);

  return { connected, onlineUsers, typingUsers, sendMessage, deleteMessage, reactMessage, sendTyping };
}
