/**
 * Satu-satunya pintu masuk untuk membaca environment variable di frontend.
 * URL backend TIDAK boleh ditulis langsung di source code — selalu lewat VITE_API_BASE_URL.
 * Seluruh fitur debug/demo/simulasi dikontrol terpusat di `src/config/devFlags.js`.
 */

const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL;

  if (!raw || !String(raw).trim()) {
    throw new Error(
      'VITE_API_BASE_URL belum diatur. Salin .env.example menjadi .env.local lalu isi URL backend.',
    );
  }

  return trimTrailingSlash(String(raw).trim());
}

/** OAuth Client ID Google (publik) dari Google Cloud Console; kosong = fitur nonaktif. */
export const getGoogleClientId = () => String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

export const appName = import.meta.env.VITE_APP_NAME || 'Difabel Jabar Connect';

export const isDev = import.meta.env.DEV;

export const isTest = import.meta.env.MODE === 'test';
