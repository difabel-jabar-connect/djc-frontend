import { PATHS } from '@/routes/paths';

export const SESSION_STORAGE_KEY = 'djc.session';

/**
 * Akun demo untuk mode development (backend auth belum tersedia).
 * Tidak dipakai di build production.
 */
export const DEMO_ACCOUNTS = {
  customer: {
    id: 'u-budi',
    name: 'Budi Santoso',
    email: 'budi.santoso@contoh.id',
    role: 'customer',
    city: 'Bandung',
  },
  provider: { id: 'deni-setiawan', name: 'Deni Setiawan', role: 'provider', city: 'Bekasi' },
  admin: { id: 'u-andi', name: 'Andi Pratama', role: 'admin', city: 'Bandung' },
};

/**
 * Lengkapi profil sesi dari respons API (nama tampilan, nama depan, inisial).
 * Respons tanpa `role` dianggap bukan profil pengguna.
 */
export function toSessionUser(raw) {
  if (!raw?.role) return null;
  const name = String(raw.name || raw.email?.split('@')[0] || 'Pengguna').trim();
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
