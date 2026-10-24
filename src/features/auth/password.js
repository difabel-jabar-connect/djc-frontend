export const PASSWORD_MIN = 8;

const LEVELS = [
  { label: 'belum diisi', tone: 'empty' },
  { label: 'lemah', tone: 'weak' },
  { label: 'sedang', tone: 'medium' },
  { label: 'kuat', tone: 'strong' },
];

/**
 * Perkiraan kekuatan kata sandi (0–3) untuk umpan balik pengguna, bukan pengganti
 * validasi server. 1 = memenuhi panjang minimum, +1 huruf & angka, +1 simbol/campuran besar-kecil.
 */
export function passwordStrength(password) {
  if (!password) return { score: 0, ...LEVELS[0] };
  let score = 1;
  if (password.length >= PASSWORD_MIN && /[a-z]/i.test(password) && /\d/.test(password)) score += 1;
  if (
    password.length >= PASSWORD_MIN &&
    (/[^a-z0-9]/i.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password)))
  ) {
    score += 1;
  }
  if (password.length < PASSWORD_MIN) score = 1;
  return { score, ...LEVELS[score] };
}

/** "rina.amalia@gmail.com" → "rina•••@gmail.com" (untuk ditampilkan, bukan disimpan). */
export function maskEmail(email) {
  const [local, domain] = String(email ?? '').split('@');
  if (!local || !domain) return '';
  return `${local.slice(0, Math.min(4, Math.max(1, local.length - 1)))}•••@${domain}`;
}
