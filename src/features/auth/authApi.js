import { api } from '@/lib/api/client';

/**
 * POST /auth/login — sesi disimpan backend sebagai HttpOnly cookie `djc_token`
 * (klien API selalu memakai credentials: 'include'). Mengembalikan `data` respons:
 * `{ user, token }`; `token` tidak dipakai frontend.
 */
export async function login({ email, password, remember }) {
  const res = await api.post('/auth/login', { email, password, remember });
  return res?.data;
}

/**
 * GET /auth/me — pengguna yang sedang login (dari cookie sesi), untuk memulihkan sesi
 * saat aplikasi dimuat. Mengembalikan profil pengguna (+ `provider_profile` untuk provider).
 * 401 bila belum login atau sesi kedaluwarsa.
 */
export async function fetchCurrentUser() {
  const res = await api.get('/auth/me');
  const { user, provider_profile: providerProfile } = res?.data ?? {};
  return providerProfile !== undefined ? { ...user, provider_profile: providerProfile } : user;
}

/** POST /auth/logout — backend menghapus cookie sesi. */
export async function logout() {
  await api.post('/auth/logout');
}

/**
 * POST /auth/register — `role`: 'customer' (Pengguna) atau 'provider' (Mitra, menunggu
 * verifikasi pengelola; wajib `alumni_reg_no` dan `city`). Tidak langsung login.
 * Field lain: `full_name`, `email`, `phone` (+62…), `password`.
 */
export async function register(payload) {
  const res = await api.post('/auth/register', payload);
  return res?.data;
}

/** POST /auth/verification/resend — kirim ulang email verifikasi. */
export async function resendVerification(email) {
  await api.post('/auth/verification/resend', { email });
}

/**
 * POST /auth/password/forgot — kirim tautan reset (berlaku 30 menit) ke email.
 * 404 bila email tidak terdaftar. Path mengikuti rancangan Auth API; sesuaikan bila berubah.
 */
export async function requestPasswordReset(email) {
  await api.post('/auth/password/forgot', { email });
}

/** POST /auth/password/reset — simpan kata sandi baru. 410 bila tautan kedaluwarsa. */
export async function resetPassword({ token, password }) {
  await api.post('/auth/password/reset', { token, password });
}
