import { normalizeLocalPhone } from './accountForm';
import { PLATFORM_FIELDS, TAGLINE_MAX } from './settingsData';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function phoneError(value, label = 'Nomor WhatsApp') {
  const digits = normalizeLocalPhone(value);
  if (!digits) return `${label} wajib diisi.`;
  if (digits.length < 9 || digits.length > 13)
    return `${label} terdiri dari 9–13 angka setelah +62.`;
  return '';
}

/* ——— Profil Saya ——— */

export function validateProfile(values) {
  const errors = {};
  if (values.name.trim().length < 3) errors.name = 'Nama lengkap wajib diisi (minimal 3 huruf).';
  const phone = phoneError(values.phone);
  if (phone) errors.phone = phone;
  return errors;
}

/* ——— Keamanan: kata sandi ——— */

export const PASSWORD_RULES = [
  { id: 'length', label: 'Minimal 8 karakter', test: (v) => v.length >= 8 },
  {
    id: 'case',
    label: 'Huruf besar & huruf kecil',
    test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v),
  },
  { id: 'digit', label: 'Mengandung angka', test: (v) => /\d/.test(v) },
];

/** Kekuatan kata sandi: 0 (kosong) – 3 (kuat), berdasarkan syarat yang terpenuhi. */
export function passwordStrength(value) {
  if (!value) return { score: 0, label: '', tone: 'neutral' };
  const score = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  return [
    { score: 1, label: 'Lemah', tone: 'danger' },
    { score: 1, label: 'Lemah', tone: 'danger' },
    { score: 2, label: 'Sedang', tone: 'warning' },
    { score: 3, label: 'Kuat', tone: 'success' },
  ][score];
}

export function validatePasswordChange({ current, next, confirm }) {
  const errors = {};
  if (!current) errors.current = 'Masukkan kata sandi saat ini.';
  if (!PASSWORD_RULES.every((rule) => rule.test(next)))
    errors.next = 'Kata sandi baru belum memenuhi semua syarat.';
  else if (next === current) errors.next = 'Kata sandi baru harus berbeda dari yang lama.';
  if (!confirm) errors.confirm = 'Ulangi kata sandi baru.';
  else if (confirm !== next) errors.confirm = 'Konfirmasi kata sandi tidak cocok.';
  return errors;
}

/* ——— Informasi Platform ——— */

export function validatePlatformInfo(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Nama platform wajib diisi.';
  if (!values.tagline.trim()) errors.tagline = 'Tagline wajib diisi.';
  else if (values.tagline.length > TAGLINE_MAX)
    errors.tagline = `Tagline maksimal ${TAGLINE_MAX} karakter.`;
  if (!values.email.trim()) errors.email = 'Email bantuan wajib diisi.';
  else if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = 'Format email belum benar, contoh nama@email.com.';
  const phone = phoneError(values.phone, 'Nomor WhatsApp bantuan');
  if (phone) errors.phone = phone;
  return errors;
}

/** Ambil "08.00–15.00 WIB" dari "Senin–Jumat, 08.00–15.00 WIB" agar ringkasan lebih ringkas. */
const shortHours = (value) => value.split(', ').pop();

const describePartners = (before, after) => {
  const names = (list) => list.map((p) => p.name);
  const added = after.filter((p) => !before.some((b) => b.id === p.id));
  const edited = after.filter((p) => {
    const old = before.find((b) => b.id === p.id);
    return old && (old.name !== p.name || old.description !== p.description);
  });
  return [
    added.length && `ditambah ${names(added).join(', ')}`,
    edited.length && `diubah ${names(edited).join(', ')}`,
  ]
    .filter(Boolean)
    .join('; ');
};

/**
 * Daftar perubahan Informasi Platform: `[{ key, label, section, before, after }]`.
 * Untuk mitra, `after` berupa ringkasan teks perubahan.
 */
export function diffPlatformInfo(saved, draft) {
  return Object.keys(PLATFORM_FIELDS)
    .filter((key) =>
      key === 'partners'
        ? JSON.stringify(saved.partners) !== JSON.stringify(draft.partners)
        : saved[key].trim() !== draft[key].trim(),
    )
    .map((key) => {
      const meta = PLATFORM_FIELDS[key];
      if (key === 'partners')
        return {
          key,
          ...meta,
          before: null,
          after: describePartners(saved.partners, draft.partners),
        };
      const format = key === 'hours' ? shortHours : (v) => v.trim();
      return { key, ...meta, before: format(saved[key]), after: format(draft[key]) };
    });
}
