import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import postgres from "postgres";
import { notifyOfflineMembersOfMessage } from "./push";

const PORT = process.env.PORT ?? 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:3000";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET!;
const DATABASE_URL = process.env.DATABASE_URL!;
const WS_INTERNAL_SECRET = process.env.WS_INTERNAL_SECRET!;

if (!NEXTAUTH_SECRET || !DATABASE_URL || !WS_INTERNAL_SECRET) {
  console.error("Missing NEXTAUTH_SECRET, DATABASE_URL, or WS_INTERNAL_SECRET");
  process.exit(1);
}

// prepare:false is required for compatibility with the Neon connection pooler
// (PgBouncer). With prepared statements, cached plans break after schema/type
// changes ("cached plan must not change result type"). Matches src/db/index.ts.
const sql = postgres(DATABASE_URL, { prepare: false, ssl: "require", max: 5 });

const app = express();
app.use(express.json());
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, credentials: true },
  pingInterval: 25_000,
  pingTimeout: 20_000,
});

// Internal endpoint — called by the Next.js server action after a chat reset.
// Broadcasts chat_reset to all connected clients in the group.
app.post("/internal/chat-reset", (req, res) => {
  const secret = req.headers["x-internal-secret"];
  if (!secret || secret !== WS_INTERNAL_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { groupId } = req.body as { groupId?: string };
  if (!groupId) {
    res.status(400).json({ error: "groupId required" });
    return;
  }
  io.to(groupId).emit("chat_reset");
  res.json({ ok: true });
});

interface AuthPayload {
  sub: string;        // userId
  name?: string | null;
  picture?: string | null;
  groupId: string;
}

// ── Auth middleware ──────────────────────────────────────────────────────────
io.use((socket: Socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;
  if (!token) return next(new Error("No token"));

  try {
    const payload = jwt.verify(token, NEXTAUTH_SECRET) as AuthPayload;
    (socket as Socket & { user: AuthPayload }).user = payload;
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

// ── Per-group presence: userId → { name, picture } ─────────────────────────
const groupPresence = new Map<string, Map<string, { name: string | null; picture: string | null }>>();

function getPresenceList(gId: string) {
  const map = groupPresence.get(gId);
  if (!map) return [];
  return Array.from(map.entries()).map(([id, info]) => ({ userId: id, name: info.name, picture: info.picture }));
}

// ── Connection ───────────────────────────────────────────────────────────────
io.on("connection", (rawSocket: Socket) => {
  const socket = rawSocket as Socket & { user: AuthPayload };
  const { sub: userId, name: userName, picture: userImage, groupId } = socket.user;

  void socket.join(groupId);

  // Track presence
  if (!groupPresence.has(groupId)) groupPresence.set(groupId, new Map());
  groupPresence.get(groupId)!.set(userId, { name: userName ?? null, picture: userImage ?? null });
  io.to(groupId).emit("presence_update", getPresenceList(groupId));

  // Send the current read state of the group to the freshly-connected client
  void (async () => {
    try {
      const rows = await sql`
        SELECT crs.user_id, u.name, u.image, crs.last_read_at
        FROM chat_read_state crs
        LEFT JOIN users u ON u.id = crs.user_id
        WHERE crs.group_id = ${groupId}
      `;
      socket.emit(
        "read_state",
        rows.map((r) => ({
          userId: r.user_id,
          name: r.name ?? null,
          picture: r.image ?? null,
          lastReadAt: new Date(r.last_read_at).toISOString(),
        })),
      );
    } catch (err) {
      console.error("read_state load error", err);
    }
  })();

  // ── send_message ────────────────────────────────────────────────────────────
  socket.on(
    "send_message",
    async (
      data: {
        content: string;
        type: "text" | "image";
        metadata?: Record<string, unknown> | null;
        replyToId?: string | null;
      },
      ack: (res: { ok: boolean; message?: unknown; error?: string }) => void,
    ) => {
      try {
        const { content, type, metadata, replyToId } = data;
        if (!content || content.length > 2000) {
          return ack({ ok: false, error: "Invalid content" });
        }

        if (replyToId) {
          const [ref] = await sql`
            SELECT group_id FROM messages WHERE id = ${replyToId} LIMIT 1
          `;
          if (!ref || ref.group_id !== groupId) {
            return ack({ ok: false, error: "Invalid replyToId" });
          }
        }

        const [msg] = await sql`
          INSERT INTO messages (group_id, sender_id, type, content, metadata, reply_to_id)
          VALUES (
            ${groupId}, ${userId}, ${type},
            ${type === "text" ? content.trim() : content},
            ${metadata ? sql.json(metadata as Record<string, string>) : null},
            ${replyToId ?? null}
          )
          RETURNING id, sender_id, content, type, metadata, reply_to_id, created_at
        `;

        let replyTo = null;
        if (msg.reply_to_id) {
          const [ref] = await sql`
            SELECT m.id, u.name AS sender_name, m.content, m.type, m.is_deleted
            FROM messages m
            LEFT JOIN users u ON u.id = m.sender_id
            WHERE m.id = ${msg.reply_to_id}
            LIMIT 1
          `;
          if (ref) replyTo = { id: ref.id, senderName: ref.sender_name, content: ref.content, type: ref.type, isDeleted: ref.is_deleted };
        }

        const fullMessage = {
          id: msg.id,
          senderId: msg.sender_id,
          senderName: userName ?? null,
          senderImage: userImage ?? null,
          content: msg.content,
          type: msg.type,
          metadata: msg.metadata,
          replyToId: msg.reply_to_id,
          replyTo,
          reactions: [],
          createdAt: new Date(msg.created_at).toISOString(),
        };

        io.to(groupId).emit("new_message", fullMessage);
        ack({ ok: true, message: fullMessage });

        const onlineUserIds = new Set(groupPresence.get(groupId)?.keys() ?? []);
        notifyOfflineMembersOfMessage(sql, {
          groupId,
          senderId: userId,
          senderName: userName ?? null,
          content: msg.content,
          messageType: msg.type,
          onlineUserIds,
        }).catch((err) => console.error("chat push notify error", err));
      } catch (err) {
        console.error("send_message error", err);
        ack({ ok: false, error: "Server error" });
      }
    },
  );

  // ── delete_message ──────────────────────────────────────────────────────────
  socket.on("delete_message", async (messageId: string, ack: (res: { ok: boolean }) => void) => {
    try {
      const [msg] = await sql`
        SELECT sender_id, group_id FROM messages WHERE id = ${messageId} LIMIT 1
      `;
      if (!msg || msg.group_id !== groupId) return ack({ ok: false });

      // Allow sender to delete own message; allow owner/admin to delete any
      if (msg.sender_id !== userId) {
        const [membership] = await sql`
          SELECT role FROM group_members
          WHERE group_id = ${groupId} AND user_id = ${userId} AND status = 'active'
          LIMIT 1
        `;
        const isPrivileged = membership?.role === "owner" || membership?.role === "admin";
        if (!isPrivileged) return ack({ ok: false });
      }

      await sql`UPDATE messages SET is_deleted = true, deleted_at = NOW(), updated_at = NOW() WHERE id = ${messageId}`;
      io.to(groupId).emit("message_deleted", messageId);
      ack({ ok: true });
    } catch {
      ack({ ok: false });
    }
  });

  // ── react_message ───────────────────────────────────────────────────────────
  socket.on(
    "react_message",
    async (data: { messageId: string; emoji: string }, ack: (res: { ok: boolean }) => void) => {
      try {
        const { messageId, emoji } = data;

        const [existing] = await sql`
          SELECT id FROM message_reactions
          WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
          LIMIT 1
        `;

        if (existing) {
          await sql`DELETE FROM message_reactions WHERE id = ${existing.id}`;
        } else {
          await sql`
            INSERT INTO message_reactions (message_id, user_id, emoji)
            VALUES (${messageId}, ${userId}, ${emoji})
            ON CONFLICT DO NOTHING
          `;
        }

        const reactionsRaw = await sql`
          SELECT mr.emoji, mr.user_id, u.name AS user_name
          FROM message_reactions mr
          LEFT JOIN users u ON u.id = mr.user_id
          WHERE mr.message_id = ${messageId}
        `;

        const grouped = new Map<string, { userIds: string[]; userNames: string[] }>();
        for (const r of reactionsRaw) {
          if (!grouped.has(r.emoji)) grouped.set(r.emoji, { userIds: [], userNames: [] });
          const g = grouped.get(r.emoji)!;
          g.userIds.push(r.user_id);
          g.userNames.push(r.user_name ?? "Unknown");
        }
        const reactions = Array.from(grouped.entries()).map(([emoji, { userIds, userNames }]) => ({
          emoji, count: userIds.length, userIds, userNames,
        }));

        io.to(groupId).emit("reactions_updated", { messageId, reactions });
        ack({ ok: true });
      } catch {
        ack({ ok: false });
      }
    },
  );

  // ── mark_read ─────────────────────────────────────────────────────────────────
  socket.on(
    "mark_read",
    async (data: { at?: string }, ack?: (res: { ok: boolean }) => void) => {
      try {
        const at = data?.at ? new Date(data.at) : new Date();
        if (isNaN(at.getTime())) return ack?.({ ok: false });

        const [row] = await sql`
          INSERT INTO chat_read_state (group_id, user_id, last_read_at)
          VALUES (${groupId}, ${userId}, ${at})
          ON CONFLICT (group_id, user_id)
          DO UPDATE SET
            last_read_at = GREATEST(chat_read_state.last_read_at, EXCLUDED.last_read_at),
            updated_at = NOW()
          RETURNING last_read_at
        `;

        io.to(groupId).emit("read_updated", {
          userId,
          name: userName ?? null,
          picture: userImage ?? null,
          lastReadAt: new Date(row.last_read_at).toISOString(),
        });
        ack?.({ ok: true });
      } catch (err) {
        console.error("mark_read error", err);
        ack?.({ ok: false });
      }
    },
  );

  // ── typing ───────────────────────────────────────────────────────────────────
  socket.on("typing_start", () => {
    socket.to(groupId).emit("user_typing", { userId, name: userName ?? null });
  });

  socket.on("typing_stop", () => {
    socket.to(groupId).emit("user_stop_typing", { userId });
  });

  socket.on("disconnect", () => {
    void socket.leave(groupId);
    groupPresence.get(groupId)?.delete(userId);
    if (groupPresence.get(groupId)?.size === 0) groupPresence.delete(groupId);
    io.to(groupId).emit("presence_update", getPresenceList(groupId));
  });
});

httpServer.listen(PORT, () => {
  console.log(`WS server running on port ${PORT}`);
});
