import { api } from './client';

/** GET /health — dipakai untuk verifikasi koneksi frontend ↔ backend (SP1-01). */
export function getHealth(options) {
  return api.get('/health', options);
}
