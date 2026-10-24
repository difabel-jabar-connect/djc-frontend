/**
 * Utilitas tanggal, slot waktu, dan harga pemesanan.
 * Semua tanggal diperlakukan sebagai tanggal lokal (tanpa jam).
 */

export const TIME_SLOTS = [
  '08.00',
  '09.00',
  '10.00',
  '11.00',
  '13.00',
  '14.00',
  '15.00',
  '16.00',
  '17.00',
];

/** Slot penuh — contoh statis sesuai desain; nanti dari API ketersediaan penyedia. */
export const SAMPLE_FULL_SLOTS = ['13.00', '15.00'];

export const ADMIN_FEE = 5000;

const pad = (n) => String(n).padStart(2, '0');

export const toISODate = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function parseISODate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return toISODate(date) === value ? date : null;
}

export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date, days) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const formatLongDate = (date) =>
  new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

export const formatShortDate = (date) =>
  new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }).format(
    date,
  );

export const formatMonthYear = (date) =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);

export const WEEKDAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/** `count` hari mulai `start`, ditandai buka/libur sesuai hari kerja penyedia. */
export function upcomingDays(start, workDays, count = 7) {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(start, i);
    return {
      date,
      iso: toISODate(date),
      weekday: WEEKDAY_SHORT[date.getDay()],
      label: `${date.getDate()} ${MONTH_SHORT[date.getMonth()]}`,
      available: workDays.includes(date.getDay()),
    };
  });
}

/** Sel kalender bulan (Senin di kolom pertama); `null` = sel kosong sebelum tanggal 1. */
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const leading = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: days }, (_, i) => new Date(year, month, i + 1)),
  ];
}

/**
 * Pilih slot waktu berurutan. Klik slot di ujung rentang → perpanjang/perpendek;
 * klik slot lain → mulai rentang baru. Rentang tidak boleh melewati slot penuh/jeda.
 */
export function toggleSlot(selected, slot, slots = TIME_SLOTS, full = []) {
  if (full.includes(slot)) return selected;
  const indexes = selected.map((s) => slots.indexOf(s)).sort((a, b) => a - b);
  const index = slots.indexOf(slot);
  if (!indexes.length) return [slot];

  const first = indexes[0];
  const last = indexes[indexes.length - 1];
  const contiguous = (a, b) => hourOf(slots[b]) - hourOf(slots[a]) === b - a;

  if (index === first || index === last) {
    const rest = indexes.filter((i) => i !== index);
    return rest.map((i) => slots[i]);
  }
  if (
    (index === last + 1 && contiguous(last, index)) ||
    (index === first - 1 && contiguous(index, first))
  ) {
    return [...indexes, index].sort((a, b) => a - b).map((i) => slots[i]);
  }
  return [slot];
}

const hourOf = (slot) => Number.parseInt(slot, 10);

/** "09.00–11.00 (2 jam)" dari slot terpilih. */
export function formatSlotRange(selected) {
  if (!selected.length) return '';
  const hours = selected.map(hourOf).sort((a, b) => a - b);
  const end = hours[hours.length - 1] + 1;
  return `${pad(hours[0])}.00–${pad(end)}.00 (${hours.length} jam)`;
}

/** Biaya layanan: tarif per jam dikali durasi; satuan lain dihitung satu kali. */
export function calculateServiceFee(pkg, hours) {
  if (!pkg) return 0;
  return pkg.priceUnit === 'jam' ? pkg.priceFrom * Math.max(hours, 1) : pkg.priceFrom;
}
