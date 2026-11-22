import { useEffect } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  getBookingMessages,
  getChatInbox,
  markBookingMessagesRead,
  sendBookingMessage,
} from './chatApi';
import {
  applyRemoteRead,
  applyRemoteTyping,
  findThreadByBooking,
  receiveRemoteMessage,
  clearRemoteThreads,
  setChatTransport,
  setRemoteHistory,
  upsertRemoteThread,
} from './chatStore';
import { connectSocket, disconnectSocket } from './socket';

/**
 * Menghubungkan `chatStore` ke backend (BE-10): Socket.io untuk real-time, REST sebagai
 * riwayat dan cadangan saat socket belum tersambung.
 *
 * Event server: new_message, messages_read, user_typing, inbox_updated (lihat
 * djc-backend src/realtime/chatSocket.js).
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Id dari backend (UUID)? Data demo memakai id seperti 'u-budi' atau 'BK-0011'. */
export const isBackendId = (value) => UUID.test(String(value ?? ''));

const joined = new Set();
let socket = null;
let connectedBefore = false;

/** Emit dengan ack; menolak bila socket tidak tersambung atau server menjawab error. */
function emitAck(event, payload, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket belum tersambung.'));
      return;
    }
    socket.timeout(timeoutMs).emit(event, payload, (err, res) => {
      if (err) reject(err);
      else if (res?.ok) resolve(res.data);
      else reject(new ApiError(res?.error?.message ?? 'Gagal.', { code: res?.error?.code }));
    });
  });
}

function ensureSocket() {
  if (socket) return socket;
  socket = connectSocket();
  socket.on('connect', () => {
    // Gabung ke room yang sedang dibuka; saat sambung ulang, ambil juga pesan yang terlewat.
    const reconnect = connectedBefore;
    connectedBefore = true;
    joined.forEach((bookingId) => {
      socket.emit('join_room', { booking_id: bookingId }, () => {});
      if (reconnect) loadHistory(bookingId).catch(() => {});
    });
  });
  socket.on('new_message', receiveRemoteMessage);
  socket.on('messages_read', ({ booking_id: bookingId, reader_role: role }) =>
    applyRemoteRead(bookingId, role),
  );
  socket.on('user_typing', ({ booking_id: bookingId, role, is_typing: active }) =>
    applyRemoteTyping(bookingId, role, active),
  );
  socket.on('inbox_updated', ({ booking_id: bookingId, message }) => {
    // Room yang sedang dibuka sudah menerima `new_message`; sisanya cukup ringkasan inbox.
    if (joined.has(bookingId) || !message) return;
    if (findThreadByBooking(bookingId)) receiveRemoteMessage(message);
    else refreshInbox().catch(() => {});
  });
  return socket;
}

setChatTransport({
  async send(bookingId, text) {
    ensureSocket();
    try {
      return await emitAck('send_message', { booking_id: bookingId, text });
    } catch (error) {
      // Socket putus / timeout → kirim lewat REST (server tetap menyiarkan ke room).
      if (error instanceof ApiError) throw error;
      return sendBookingMessage(bookingId, text);
    }
  },
  async markRead(bookingId) {
    try {
      return await emitAck('mark_read', { booking_id: bookingId });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      return markBookingMessagesRead(bookingId);
    }
  },
  typing(bookingId, active) {
    if (socket?.connected && joined.has(bookingId)) {
      socket.emit('typing', { booking_id: bookingId, is_typing: active }, () => {});
    }
  },
});

/** Ambil riwayat pesan dari REST dan masukkan ke store. */
export async function loadHistory(bookingId) {
  const thread = findThreadByBooking(bookingId);
  if (!thread) return;
  const result = await getBookingMessages(bookingId, { limit: 100 });
  setRemoteHistory(thread.code, result.messages, {
    status: result.booking?.status ?? thread.status,
    canSend: result.booking?.can_send ?? thread.canSend,
    disabilityType: result.provider_disability_type ?? thread.disabilityType ?? null,
    error: null,
  });
}

/** Buka percakapan backend: gabung room Socket.io + muat riwayat. Mengembalikan fungsi tutup. */
export function openRemoteThread(bookingId) {
  const s = ensureSocket();
  joined.add(bookingId);
  if (s.connected) s.emit('join_room', { booking_id: bookingId }, () => {});
  loadHistory(bookingId).catch((error) => {
    const thread = findThreadByBooking(bookingId);
    if (thread) {
      upsertRemoteThread({
        code: thread.code,
        bookingId,
        loaded: true,
        error: error?.message ?? 'Riwayat chat gagal dimuat.',
      });
    }
  });
  return () => {
    joined.delete(bookingId);
    if (s.connected) s.emit('leave_room', { booking_id: bookingId }, () => {});
  };
}

/** Hook: selama komponen terpasang, percakapan `bookingId` tersinkron dengan backend. */
export function useRemoteThread(bookingId) {
  useEffect(() => {
    if (!isBackendId(bookingId)) return undefined;
    return openRemoteThread(bookingId);
  }, [bookingId]);
}

let inboxViewer = null;

/** Muat daftar percakapan dari GET /chat/inbox untuk `viewer` ('customer' | 'provider'). */
export async function loadInbox(viewer) {
  inboxViewer = viewer;
  ensureSocket();
  const items = await getChatInbox();
  for (const item of items) {
    const isCustomer = viewer === 'customer';
    const last = item.last_message;
    upsertRemoteThread({
      code: item.booking.code,
      bookingId: item.booking.id,
      viewer,
      status: item.booking.status,
      service: item.booking.service_title,
      canSend: item.can_send,
      unread: item.unread_count,
      providerName: isCustomer ? item.counterpart.name : undefined,
      customerName: isCustomer ? undefined : item.counterpart.name,
      disabilityType: isCustomer ? item.counterpart.disability_type : undefined,
      lastMessage: last
        ? { id: last.id, from: last.sender_role, text: last.message_text, at: last.created_at }
        : undefined,
    });
  }
  return items;
}

function refreshInbox() {
  return inboxViewer ? loadInbox(inboxViewer) : Promise.resolve([]);
}

/** Hook: muat inbox backend sekali saat `enabled`. */
export function useChatInbox(viewer, enabled) {
  useEffect(() => {
    if (!enabled) return;
    loadInbox(viewer).catch(() => {});
  }, [viewer, enabled]);
}

/** Saat keluar akun: putuskan socket dan lupakan room yang diikuti. */
export function resetChatSync() {
  joined.clear();
  inboxViewer = null;
  connectedBefore = false;
  socket = null;
  disconnectSocket();
  clearRemoteThreads();
}
