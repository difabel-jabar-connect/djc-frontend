/**
 * Format tanggal & aturan validasi area Admin.
 * Semua waktu ditampilkan dalam WIB (UTC+7) apa pun zona waktu perangkat,
 * sehingga tampilan sama di browser mana pun (dan stabil di test).
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];
const WEEKDAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const WEEKDAYS_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const WIB_OFFSET = 7 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** Komponen tanggal/jam dalam WIB. */
function wib(value) {
  const shifted = new Date(new Date(value).getTime() + WIB_OFFSET);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    day: shifted.getUTCDate(),
    weekday: shifted.getUTCDay(),
    hour: String(shifted.getUTCHours()).padStart(2, '0'),
    minute: String(shifted.getUTCMinutes()).padStart(2, '0'),
  };
}

/** "27 Okt 2026" */
export function formatDate(value) {
  const d = wib(value);
  return `${d.day} ${MONTHS[d.month]} ${d.year}`;
}

/** "27 Okt" */
export function formatDayMonth(value) {
  const d = wib(value);
  return `${d.day} ${MONTHS[d.month]}`;
}

/** "17.30" */
export function formatTime(value) {
  const d = wib(value);
  return `${d.hour}.${d.minute}`;
}

/** "27 Okt 2026, 17.30 WIB" */
export const formatDateTime = (value) => `${formatDate(value)}, ${formatTime(value)} WIB`;

/** "Sel, 27 Okt 2026 · 09.00 WIB" */
export function formatSchedule(value) {
  const d = wib(value);
  return `${WEEKDAYS[d.weekday]}, ${formatDate(value)} · ${formatTime(value)} WIB`;
}

/** "Selasa, 27 Oktober 2026 · 09.00–11.00 WIB" */
export function formatScheduleLong(value, hours) {
  const d = wib(value);
  const end = new Date(new Date(value).getTime() + hours * 60 * 60 * 1000);
  return `${WEEKDAYS_LONG[d.weekday]}, ${d.day} ${MONTHS_LONG[d.month]} ${d.year} · ${formatTime(value)}–${formatTime(end)} WIB`;
}

/** Kolom "Terakhir Aktif": akun sendiri = sedang aktif, belum pernah masuk = keterangan. */
export function lastActiveLabel(user, selfId) {
  if (user.id === selfId) return 'Sedang aktif';
  return user.lastActiveAt ? formatDateTime(user.lastActiveAt) : 'Belum pernah masuk';
}

/** Selisih hari kalender (WIB) antara `value` dan `now`. */
export function daysSince(value, now = new Date()) {
  const a = wib(value);
  const b = wib(now);
  return Math.round((Date.UTC(b.year, b.month, b.day) - Date.UTC(a.year, a.month, a.day)) / DAY);
}

/** "Hari ini" · "1 hari" · "9 hari" */
export function formatWaiting(value, now = new Date()) {
  const days = Math.max(0, daysSince(value, now));
  return days === 0 ? 'Hari ini' : `${days} hari`;
}

/** Jam yang sudah berlalu sejak `value`. */
export const hoursSince = (value, now = new Date()) =>
  (new Date(now).getTime() - new Date(value).getTime()) / (60 * 60 * 1000);

/** Rentang tanggal untuk filter ("7" / "30" hari terakhir, '' = semua). */
export const DATE_RANGE_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: '7', label: '7 hari terakhir' },
  { value: '30', label: '30 hari terakhir' },
];

export function inDateRange(value, range, now = new Date()) {
  if (!range) return true;
  const days = daysSince(value, now);
  return days >= 0 && days < Number(range);
}

/** Inisial dari nama: "Rina Wulandari" → "RW". */
export function initialsOf(name) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase();
}

const AVATAR_COLORS = ['#0e7490', '#0b3c6e', '#0c7272', '#9a3412', '#6d28d9', '#be185d', '#1d4ed8'];

/** Warna avatar yang stabil untuk sebuah nama. */
export function avatarColor(name) {
  const sum = [...String(name)].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

/* ——— Aturan "Aksi dengan Alasan" (desain Pola Aksi dengan Alasan) ——— */

export const REASON_MIN = 10;
export const REASON_MAX = 300;

/** Pesan galat untuk alasan wajib; '' bila valid atau belum diisi. */
export function reasonError(text, { required = true } = {}) {
  const length = text.trim().length;
  if (!required || length === 0 || length >= REASON_MIN) return '';
  return `Alasan minimal ${REASON_MIN} karakter.`;
}

export const isReasonValid = (text, { required = true } = {}) =>
  !required || text.trim().length >= REASON_MIN;
