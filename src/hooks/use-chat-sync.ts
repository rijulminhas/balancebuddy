"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ChatMessage } from "@/types/chat";

// 20 s — 4× fewer DB round-trips vs the original 5 s.
// Combined with the visibility pause this reduces idle transfer by ~90 %.
const SYNC_INTERVAL_MS = 20_000;

/**
 * Drives background message sync for a chat window.
 *
 * Improvements over the previous inline setInterval approach:
 * - Pauses automatically when the browser tab is hidden (Page Visibility API).
 * - Does an immediate catch-up poll the moment the tab regains focus so no
 *   messages are missed despite the longer interval.
 * - Passes groupId directly to the server so the poll handler can skip the
 *   extra getActiveGroupId DB round-trip on every request.
 */
export function useChatSync(
  groupId: string,
  initialLastTs: string,
  onReceive: (messages: ChatMessage[]) => void,
) {
  const lastTsRef = useRef<string>(initialLastTs);
  const lastPollAtRef = useRef<string>(new Date().toISOString());
  const [isPolling, setIsPolling] = useState(false);

  // Store the callback in a ref so `poll` never needs to be recreated when
  // the component re-renders and passes a new function reference.
  const onReceiveRef = useRef(onReceive);
  useEffect(() => {
    onReceiveRef.current = onReceive;
  });

  const poll = useCallback(async () => {
    const pollTime = new Date().toISOString();
    setIsPolling(true);
    try {
      const res = await fetch(
        `/api/chat/poll?groupId=${encodeURIComponent(groupId)}&since=${encodeURIComponent(lastTsRef.current)}&updatedSince=${encodeURIComponent(lastPollAtRef.current)}`,
      );
      if (!res.ok) return;
      const data = (await res.json()) as { messages: ChatMessage[] };
      if (!data.messages.length) return;

      // Advance cursor only for genuinely new messages, not for reaction/reply
      // updates (those have createdAt <= lastTsRef.current).
      const latestNew = [...data.messages]
        .reverse()
        .find((m) => m.createdAt > lastTsRef.current);
      if (latestNew) lastTsRef.current = latestNew.createdAt;

      onReceiveRef.current(data.messages);
    } finally {
      setIsPolling(false);
      lastPollAtRef.current = pollTime;
    }
  }, [groupId]);

  // Visibility-aware interval: stop ticking while the tab is hidden so we
  // make zero DB requests when the user isn't looking at the page.
  useEffect(() => {
    let timerId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timerId !== null) return;
      timerId = setInterval(() => void poll(), SYNC_INTERVAL_MS);
    };

    const stop = () => {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void poll(); // immediate catch-up when user returns to this tab
        start();
      } else {
        stop();
      }
    };

    start();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [poll]);

  // Advance the cursor after an optimistic send so the next poll doesn't
  // re-fetch a message the component already added locally.
  const advanceTs = useCallback((ts: string) => {
    lastTsRef.current = ts;
  }, []);

  // Reset both cursors after a full chat wipe (ResetChatModal).
  const resetSync = useCallback(() => {
    lastTsRef.current = new Date().toISOString();
    lastPollAtRef.current = new Date().toISOString();
  }, []);

  return { isPolling, advanceTs, resetSync };
}
