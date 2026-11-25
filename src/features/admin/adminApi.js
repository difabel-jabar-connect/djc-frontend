import { api } from '@/lib/api/client';

function buildQuery(params) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value));
    }
  }
  const text = qs.toString();
  return text ? `?${text}` : '';
}

/** Ringkasan metrik dasbor admin (`GET /admin/dashboard`). */
export async function getAdminDashboard({ signal } = {}) {
  const res = await api.get('/admin/dashboard', { signal });
  return res?.data ?? null;
}

/** Daftar penyedia untuk verifikasi (`GET /admin/providers`). */
export async function listAdminProviders({ page = 1, limit = 50, status, q, signal } = {}) {
  const res = await api.get(`/admin/providers${buildQuery({ page, limit, status, q })}`, {
    signal,
  });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Verifikasi atau tolak penyedia (`PUT /admin/providers/:id/verify`). */
export async function verifyAdminProvider(id, { status, note }) {
  const payload = note ? { status, note } : { status };
  const res = await api.put(`/admin/providers/${encodeURIComponent(id)}/verify`, payload);
  return res?.data ?? null;
}

/** Daftar seluruh kategori termasuk nonaktif (`GET /admin/categories`). */
export async function listAdminCategories({ signal } = {}) {
  const res = await api.get('/admin/categories', { signal });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Tambah kategori baru (`POST /admin/categories`). */
export async function createAdminCategory(payload) {
  const res = await api.post('/admin/categories', payload);
  return res?.data ?? null;
}

/** Ubah atau aktifkan/nonaktifkan kategori (`PUT /admin/categories/:id`). */
export async function updateAdminCategory(id, payload) {
  const res = await api.put(`/admin/categories/${encodeURIComponent(id)}`, payload);
  return res?.data ?? null;
}

/** Daftar ulasan untuk moderasi (`GET /admin/reviews`). */
export async function listAdminReviews({ page = 1, limit = 50, hidden, providerId, signal } = {}) {
  const res = await api.get(
    `/admin/reviews${buildQuery({ page, limit, hidden, provider_id: providerId })}`,
    { signal },
  );
  return Array.isArray(res?.data) ? res.data : [];
}

/** Sembunyikan atau tampilkan lagi ulasan (`PUT /admin/reviews/:id/moderate`). */
export async function moderateAdminReview(id, { is_hidden, reason }) {
  const payload = reason ? { is_hidden, reason } : { is_hidden };
  const res = await api.put(`/admin/reviews/${encodeURIComponent(id)}/moderate`, payload);
  return res?.data ?? null;
}

/** Daftar akun pengguna (`GET /admin/users`). */
export async function listAdminUsers({ page = 1, limit = 50, role, status, q, signal } = {}) {
  const res = await api.get(`/admin/users${buildQuery({ page, limit, role, status, q })}`, {
    signal,
  });
  return Array.isArray(res?.data) ? res.data : [];
}

/** Penangguhan akun (`PUT /admin/users/:id/suspend`). */
export async function suspendAdminUser(id, reason) {
  const res = await api.put(`/admin/users/${encodeURIComponent(id)}/suspend`, { reason });
  return res?.data ?? null;
}

/** Pengaktifan kembali akun (`PUT /admin/users/:id/activate`). */
export async function activateAdminUser(id, reason) {
  const payload = reason ? { reason } : {};
  const res = await api.put(`/admin/users/${encodeURIComponent(id)}/activate`, payload);
  return res?.data ?? null;
}
