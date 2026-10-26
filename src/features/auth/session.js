import { PATHS } from '@/routes/paths';

export const SESSION_STORAGE_KEY = 'djc.session';

/**
 * Akun demo untuk mode development, untuk mencoba tampilan tiap peran tanpa backend.
 * `demo: true` = sesi lokal saja (tanpa cookie), jadi tidak dicek ulang ke GET /auth/me.
 * Tidak dipakai di build production.
 */
export const DEMO_ACCOUNTS = {
  customer: {
    id: 'u-budi',
    name: 'Budi Santoso',
    email: 'budi.santoso@contoh.id',
    role: 'customer',
    city: 'Bandung',
    demo: true,
  },
  provider: {
    id: 'deni-setiawan',
    name: 'Deni Setiawan',
    role: 'provider',
    city: 'Bekasi',
    demo: true,
  },
  admin: { id: 'u-andi', name: 'Andi Pratama', role: 'admin', city: 'Bandung', demo: true },
};

/**
 * Lengkapi profil sesi dari respons API (nama tampilan, nama depan, inisial).
 * Backend mengirim `full_name`; akun demo memakai `name`.
 * Respons tanpa `role` dianggap bukan profil pengguna.
 */
export function toSessionUser(raw) {
  if (!raw?.role) return null;
  const name = String(raw.name || raw.full_name || raw.email?.split('@')[0] || 'Pengguna').trim();
  const words = name.split(/\s+/);
  return {
    ...raw,
    name,
    firstName: words[0],
    initials: (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase(),
  };
}

/** Halaman awal setelah masuk, sesuai peran. */
export const homePathFor = (role) =>
  ({ provider: PATHS.providerDashboard, admin: PATHS.adminDashboard })[role] ?? PATHS.home;
