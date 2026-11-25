/**
 * SINGLE SOURCE OF TRUTH untuk seluruh UI debug, akun demo, dan fallback development di Frontend.
 *
 * Aturan arsitektur (ditegakkan oleh ESLint di `eslint.config.js`):
 * 1. Komponen & hook DILARANG membaca `import.meta.env` atau `isDev` langsung.
 *    Setiap fitur debug/demo baru WAJIB didaftarkan sebagai konstanta di file ini.
 * 2. Seluruh konstanta memakai ekspresi statis `import.meta.env.DEV` agar Vite 6 (Rollup)
 *    melakukan dead-code elimination (tree-shaking) penuh saat `npm run build` — kode debug
 *    tidak sekadar disembunyikan, tetapi dihapus dari bundle produksi (`dist/`).
 * 3. Untuk melihat tampilan bersih seperti produksi saat masih di `npm run dev`, set
 *    `VITE_DEBUG_UI=false` di `.env.local` (atau jalankan `npm run build && npm run preview`).
 *
 * Inventaris aktif (selalu sinkron dengan kode karena ini saklar aslinya):
 * - SHOW_API_STATUS             → Banner `<ApiStatus />` di `/` (`HomePage.jsx`)
 * - SHOW_DEMO_ACCOUNTS          → Panel "Akun demo (mode development)" di `/login` (`LoginPage.jsx`)
 * - ALLOW_OFFLINE_AUTH_FALLBACK → Fallback auth saat backend mati (`useGoogleAuth`, `ForgotPasswordPage`, `ResetPasswordPage`)
 * - SHOW_DEV_CONFIG_HINTS       → Pesan teknis `.env.local` saat konfigurasi dev kosong (`useGoogleAuth`)
 */

/** Helper murni untuk pengujian unit berbagai kombinasi mode (dev/prod/override). */
export function resolveDevFlags(env) {
  const isDevMode = Boolean(env?.DEV);
  const debugUiEnabled = isDevMode && String(env?.VITE_DEBUG_UI ?? '').toLowerCase() !== 'false';
  return Object.freeze({
    SHOW_API_STATUS: debugUiEnabled,
    SHOW_DEMO_ACCOUNTS: debugUiEnabled,
    ALLOW_OFFLINE_AUTH_FALLBACK: debugUiEnabled,
    SHOW_DEV_CONFIG_HINTS: isDevMode,
  });
}

// Ekspresi statis agar Vite mengganti `import.meta.env.DEV` menjadi `false` saat production build
// sehingga bundler dapat menghapus seluruh cabang UI debug dari `dist/`.
export const SHOW_API_STATUS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_UI !== 'false';

export const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV && import.meta.env.VITE_DEBUG_UI !== 'false';

export const ALLOW_OFFLINE_AUTH_FALLBACK =
  import.meta.env.DEV && import.meta.env.VITE_DEBUG_UI !== 'false';

export const SHOW_DEV_CONFIG_HINTS = import.meta.env.DEV;
