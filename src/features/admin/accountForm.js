import { REASON_MIN } from './adminFormat';

/** Email instansi wajib untuk akun Pengelola. */
export const STAFF_EMAIL_DOMAIN = '@uptdppsghd.id';

/** Masa berlaku tautan undangan (jam). */
export const INVITE_HOURS = 48;

/** Kota/kabupaten Jawa Barat untuk pilihan domisili akun baru. */
export const JABAR_REGIONS = [
  'Kota Bandung',
  'Kabupaten Bandung',
  'Kabupaten Bandung Barat',
  'Kota Bekasi',
  'Kabupaten Bekasi',
  'Kota Bogor',
  'Kabupaten Bogor',
  'Kota Cimahi',
  'Kota Cirebon',
  'Kabupaten Cirebon',
  'Kota Depok',
  'Kabupaten Garut',
  'Kabupaten Karawang',
  'Kota Sukabumi',
  'Kabupaten Sukabumi',
  'Kota Tasikmalaya',
  'Kabupaten Tasikmalaya',
];

/** "Kota Bandung" → "Bandung" (dipakai di kolom tabel). */
export const regionShort = (region) => region.replace(/^(Kota|Kabupaten) /, '');

export const ACCOUNT_TYPES = {
  pengguna: {
    label: 'Pengguna',
    title: 'Tambah Akun Pengguna',
    subtitle: 'Akun masyarakat untuk memesan layanan.',
    help: 'Untuk masyarakat yang memesan layanan. Tidak dapat membuka Dashboard Admin.',
    menuHelp: 'Untuk masyarakat yang akan memesan layanan.',
    emailHelp: 'Undangan atau info akun dikirim ke email ini.',
    submit: 'Buat Akun',
  },
  pengelola: {
    label: 'Pengelola',
    title: 'Tambah Akun Pengelola',
    subtitle: 'Staf UPTD PPSGHD yang membantu mengelola platform.',
    help: 'Untuk staf UPTD PPSGHD. Mendapat akses penuh ke Dashboard Admin.',
    menuHelp: 'Untuk staf UPTD PPSGHD yang mengelola platform.',
    emailHelp: `Gunakan email instansi (${STAFF_EMAIL_DOMAIN}).`,
    submit: 'Buat Akun Pengelola',
  },
};

export const emptyAccountForm = (type = 'pengguna') => ({
  type,
  name: '',
  email: '',
  phone: '',
  region: '',
  position: '',
  access: 'undangan',
  reason: '',
});

/** Ambil digit nomor WhatsApp tanpa awalan 0 / 62: "0812-3456" → "8123456". */
export function normalizeLocalPhone(value) {
  const digits = String(value).replace(/\D/g, '');
  return digits.replace(/^62/, '').replace(/^0+/, '');
}

/** "81234567890" → "+62 812-3456-7890" */
export function formatPhone(local) {
  const digits = normalizeLocalPhone(local);
  const groups = [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)].filter(Boolean);
  return `+62 ${groups.join('-')}`;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validasi formulir Tambah Akun. Mengembalikan objek galat per field
 * (kosong = valid). `takenEmails` = email yang sudah terdaftar (huruf kecil).
 */
export function validateAccount(form, takenEmails = []) {
  const errors = {};
  const staff = form.type === 'pengelola';
  const email = form.email.trim().toLowerCase();
  const phone = normalizeLocalPhone(form.phone);

  if (form.name.trim().length < 3) errors.name = 'Nama lengkap wajib diisi (minimal 3 huruf).';

  if (!email) errors.email = 'Email wajib diisi.';
  else if (!EMAIL_PATTERN.test(email))
    errors.email = 'Format email belum benar, contoh nama@email.com.';
  else if (staff && !email.endsWith(STAFF_EMAIL_DOMAIN))
    errors.email = `Akun Pengelola wajib memakai email instansi (${STAFF_EMAIL_DOMAIN}).`;
  else if (takenEmails.includes(email)) errors.email = 'Email ini sudah terdaftar.';

  if (!phone) errors.phone = 'Nomor WhatsApp wajib diisi.';
  else if (phone.length < 9 || phone.length > 13)
    errors.phone = 'Nomor WhatsApp terdiri dari 9–13 angka setelah +62.';

  if (!form.region) errors.region = 'Pilih kota/kabupaten.';

  if (staff && !form.position.trim()) errors.position = 'Jabatan atau unit kerja wajib diisi.';

  if (staff && form.reason.trim().length < REASON_MIN)
    errors.reason = `Alasan pembuatan akun minimal ${REASON_MIN} karakter.`;

  return errors;
}

/** Urutan field untuk memfokuskan galat pertama. */
export const ACCOUNT_FIELDS = ['name', 'email', 'phone', 'region', 'position', 'reason'];

/** Kata sandi sementara acak (contoh) untuk pendaftaran tatap muka. */
export function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
