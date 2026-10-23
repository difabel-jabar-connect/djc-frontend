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
