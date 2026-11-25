import { api } from '@/lib/api/client';

/** Profil lengkap milik penyedia yang sedang masuk (`GET /provider/profile`). */
export async function getOwnProviderProfile({ signal } = {}) {
  const res = await api.get('/provider/profile', { signal });
  return res?.data ?? null;
}

/** Perbarui profil penyedia (`PUT /provider/profile`). */
export async function updateOwnProviderProfile(payload) {
  const res = await api.put('/provider/profile', payload);
  return res?.data ?? null;
}

/** Daftar slot jadwal operasional mingguan (`GET /provider/availability`). */
export async function getOwnAvailability({ signal } = {}) {
  const res = await api.get('/provider/availability', { signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Ganti seluruh slot jadwal operasional mingguan (`PUT /provider/availability`). */
export async function replaceOwnAvailability(availability) {
  const res = await api.put('/provider/availability', { availability });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Daftar layanan milik penyedia (`GET /provider/services`), termasuk yang nonaktif. */
export async function listOwnServices({ signal } = {}) {
  const res = await api.get('/provider/services', { signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Tambah layanan baru milik penyedia (`POST /provider/services`). */
export async function createOwnService(payload) {
  const res = await api.post('/provider/services', payload);
  return res?.data ?? null;
}

/** Ubah atau aktifkan/nonaktifkan layanan milik penyedia (`PUT /provider/services/:id`). */
export async function updateOwnService(id, payload) {
  const res = await api.put(`/provider/services/${encodeURIComponent(id)}`, payload);
  return res?.data ?? null;
}

/** Daftar karya portofolio milik penyedia (`GET /provider/portfolio`). */
export async function listOwnPortfolio({ signal } = {}) {
  const res = await api.get('/provider/portfolio', { signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Daftar pesanan masuk milik penyedia (`GET /bookings?limit=50`). */
export async function listProviderBookings({ limit = 50, signal } = {}) {
  const res = await api.get(`/bookings?limit=${limit}`, { signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Daftar kategori aktif publik untuk pilihan form layanan (`GET /categories`). */
export async function listActiveCategories({ signal } = {}) {
  const res = await api.get('/categories', { signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Transisi pesanan: requested → accepted. */
export async function acceptBooking(id) {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/accept`, {});
  return res?.data ?? null;
}

/** Transisi pesanan: requested → rejected (alasan wajib ≥ 10 karakter). */
export async function rejectBooking(id, reason) {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/reject`, { reason });
  return res?.data ?? null;
}

/** Transisi pesanan: accepted → in_progress. */
export async function startBooking(id) {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/start`, {});
  return res?.data ?? null;
}

/** Transisi pesanan: in_progress → completed. */
export async function completeBooking(id, payload = {}) {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/complete`, payload);
  return res?.data ?? null;
}

/** Transisi pesanan oleh penyedia: accepted → cancelled (alasan wajib ≥ 10 karakter). */
export async function cancelProviderBooking(id, reason) {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/cancel`, { reason });
  return res?.data ?? null;
}
