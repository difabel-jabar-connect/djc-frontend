import { api } from '@/lib/api/client';

/**
 * POST /auth/login — sesi disimpan backend sebagai HttpOnly cookie
 * (klien API selalu memakai credentials: 'include'). Mengembalikan `data` respons.
 * Path endpoint mengikuti rancangan Auth API (SP1-03); sesuaikan bila kontrak berubah.
 */
export async function login({ email, password, remember }) {
  const res = await api.post('/auth/login', { email, password, remember });
  return res?.data;
}

/** POST /auth/logout — backend menghapus cookie sesi. */
export async function logout() {
  await api.post('/auth/logout');
}

/**
 * POST /auth/register — `role`: 'customer' (Pengguna) atau 'provider' (Mitra, menunggu
 * verifikasi pengelola). Backend mengirim email verifikasi.
 */
export async function register(payload) {
  const res = await api.post('/auth/register', payload);
  return res?.data;
}

/** POST /auth/verification/resend — kirim ulang email verifikasi. */
export async function resendVerification(email) {
  await api.post('/auth/verification/resend', { email });
}
