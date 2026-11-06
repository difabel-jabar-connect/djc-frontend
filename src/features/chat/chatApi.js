import { api } from '@/lib/api/client';

/**
 * Mengambil riwayat pesan untuk sebuah booking (GET /bookings/:id/messages).
 *
 * @param {string} bookingId - UUID booking
 * @param {Object} [params]
 * @param {number} [params.limit=50]
 * @param {string} [params.before_id] - UUID pesan untuk paginasi ke belakang
 * @returns {Promise<{ items: Array, can_send: boolean, provider_disability_type: string|null, meta: Object }>}
 */
export async function getBookingMessages(bookingId, params = {}) {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', params.limit);
  if (params.before_id) query.set('before_id', params.before_id);

  const qs = query.toString();
  const path = qs ? `/bookings/${bookingId}/messages?${qs}` : `/bookings/${bookingId}/messages`;
  const res = await api.get(path);
  return {
    items: res?.data ?? [],
    can_send: res?.can_send ?? true,
    provider_disability_type: res?.provider_disability_type ?? null,
    meta: res?.meta ?? {},
  };
}

/**
 * Mengirim pesan baru dalam obrolan pesanan (POST /bookings/:id/messages).
 *
 * @param {string} bookingId - UUID booking
 * @param {string} messageText - Teks pesan (1 - 1000 karakter)
 */
export async function sendBookingMessage(bookingId, messageText) {
  const res = await api.post(`/bookings/${bookingId}/messages`, {
    message_text: messageText,
  });
  return res?.data;
}

/**
 * Menandai seluruh pesan yang diterima sebagai sudah dibaca (PATCH /bookings/:id/messages/read).
 *
 * @param {string} bookingId - UUID booking
 */
export async function markBookingMessagesRead(bookingId) {
  const res = await api.patch(`/bookings/${bookingId}/messages/read`);
  return res?.data;
}

/**
 * Mengambil daftar percakapan aktif dan jumlah pesan belum dibaca (GET /chat/inbox).
 */
export async function getChatInbox() {
  const res = await api.get('/chat/inbox');
  return res?.data ?? [];
}
