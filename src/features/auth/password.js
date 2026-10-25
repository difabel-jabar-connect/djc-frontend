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

const REQUIREMENTS = [
  {
    key: 'length',
    label: `Minimal ${PASSWORD_MIN} karakter`,
    test: (p) => p.length >= PASSWORD_MIN,
  },
  {
    key: 'case',
    label: 'Mengandung huruf besar dan kecil',
    test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  },
  { key: 'digit', label: 'Mengandung angka', test: (p) => /\d/.test(p) },
];

const REQUIREMENT_LEVELS = [
  { label: 'Belum diisi', tone: 'empty' },
  { label: 'Lemah', tone: 'weak' },
  { label: 'Sedang', tone: 'medium' },
  { label: 'Kuat', tone: 'strong' },
];

/**
 * Syarat kata sandi baru (desain Atur Ulang Kata Sandi) beserta kekuatannya:
 * jumlah syarat terpenuhi = skor (0–3). `valid` bila semua syarat terpenuhi.
 */
export function checkPasswordRequirements(password = '') {
  const items = REQUIREMENTS.map(({ key, label, test }) => ({ key, label, met: test(password) }));
  const met = items.filter((item) => item.met).length;
  const score = password ? Math.max(met, 1) : 0;
  return { items, valid: met === items.length, score, ...REQUIREMENT_LEVELS[score] };
}
