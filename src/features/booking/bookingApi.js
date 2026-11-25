import { api } from '@/lib/api/client';

/**
 * Membuat pesanan booking baru (B1).
 * Hanya dapat dipanggil oleh customer yang sudah terverifikasi/aktif.
 *
 * @param {Object} payload
 * @param {string} payload.service_id - UUID layanan
 * @param {string} payload.scheduled_date - Format 'YYYY-MM-DD'
 * @param {string} payload.start_time - Format 'HH:mm'
 * @param {'at_customer'|'at_provider'} payload.service_mode
 * @param {number} [payload.quantity=1] - Durasi/jumlah unit
 * @param {string} [payload.address_text] - Wajib jika service_mode === 'at_customer'
 * @param {number} [payload.lat]
 * @param {number} [payload.lng]
 * @param {string} [payload.notes]
 */
export async function createBooking(payload) {
  const res = await api.post('/bookings', payload);
  return res?.data;
}

/**
 * Mengambil daftar pesanan milik pengguna yang sedang login (B2).
 * Untuk customer: pesanan miliknya.
 * Untuk provider: pesanan yang masuk.
 *
 * @param {Object} [filters]
 * @param {string} [filters.status] - Filter tab status ('requested', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected')
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getBookings(filters = {}, { signal } = {}) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'semua') {
    params.set('status', filters.status);
  }
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const query = params.toString();
  const path = query ? `/bookings?${query}` : '/bookings';
  const res = await api.get(path, { signal });
  return res?.data ?? [];
}

const MAX_BOOKING_PAGES = 4;
const BOOKINGS_PAGE_LIMIT = 50;

/**
 * Mengambil seluruh daftar pesanan pelanggan (maks. 4 halaman × 50 item) dari GET /bookings.
 */
export async function listCustomerBookings({ signal } = {}) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await api.get(`/bookings?page=${page}&limit=${BOOKINGS_PAGE_LIMIT}`, { signal });
    const batch = res?.data ?? [];
    items.push(...batch);
    totalPages = Number(res?.meta?.total_pages ?? 1);
    page += 1;
  } while (page <= Math.min(totalPages, MAX_BOOKING_PAGES));
  return items;
}

/**
 * Mengambil detail pesanan berdasarkan ID (B3).
 * Kontak & alamat lawan transaksi hanya dibuka jika status pesanan adalah 'accepted' atau 'in_progress'.
 *
 * @param {string} id - UUID booking
 * @param {{ signal?: AbortSignal }} [options]
 */
export async function getBookingDetail(id, { signal } = {}) {
  const res = await api.get(`/bookings/${encodeURIComponent(id)}`, { signal });
  return res?.data;
}

/**
 * Membatalkan pesanan (S5).
 * Customer dapat membatalkan saat 'requested' atau 'accepted'.
 * Provider dapat membatalkan saat 'accepted' dengan alasan wajib.
 *
 * @param {string} id - UUID booking
 * @param {string} reason - Alasan pembatalan
 */
export async function cancelBooking(id, reason) {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/cancel`, { reason });
  return res?.data;
}

/**
 * Provider menerima pesanan (S1).
 * Mengubah status dari 'requested' menjadi 'accepted'.
 */
export async function acceptBooking(id) {
  const res = await api.put(`/bookings/${id}/accept`);
  return res?.data;
}

/**
 * Provider menolak pesanan (S2).
 * Mengubah status dari 'requested' menjadi 'rejected'.
 *
 * @param {string} id
 * @param {string} reason - Alasan penolakan (min. 10 karakter)
 */
export async function rejectBooking(id, reason) {
  const res = await api.put(`/bookings/${id}/reject`, { reason });
  return res?.data;
}

/**
 * Provider memulai pengerjaan pesanan (S3).
 * Mengubah status dari 'accepted' menjadi 'in_progress'.
 */
export async function startBooking(id) {
  const res = await api.put(`/bookings/${id}/start`);
  return res?.data;
}

/**
 * Provider menyelesaikan pesanan (S4).
 * Mengubah status dari 'in_progress' menjadi 'completed'.
 *
 * @param {string} id
 * @param {Object} [data]
 * @param {number} [data.actual_quantity] - Wajib jika skema tarif hourly
 * @param {number} [data.final_total] - Total biaya final (Rp)
 */
export async function completeBooking(id, data = {}) {
  const res = await api.put(`/bookings/${id}/complete`, data);
  return res?.data;
}
