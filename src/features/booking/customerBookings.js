import { MONTH_SHORT, WEEKDAY_SHORT, formatLongDate, parseISODate } from './schedule';

/**
 * Data contoh pesanan milik pelanggan demo (desain HTML Pesanan Saya & Detail Pesanan).
 * Ganti dengan API daftar & detail pesanan pelanggan setelah endpoint tersedia.
 *
 * Status: menunggu → diterima → berjalan → selesai, atau dibatalkan/ditolak.
 * `history` diurutkan dari yang paling lama.
 */

export const BOOKING_STATUS = {
  menunggu: { label: 'Menunggu', tone: 'warning', tab: 'menunggu' },
  diterima: { label: 'Diterima', tone: 'info', tab: 'diterima' },
  berjalan: { label: 'Berjalan', tone: 'teal', tab: 'berjalan' },
  selesai: { label: 'Selesai', tone: 'success', tab: 'selesai' },
  dibatalkan: { label: 'Dibatalkan', tone: 'neutral', tab: 'batal' },
  ditolak: { label: 'Ditolak', tone: 'danger', tab: 'batal' },
};

export const BOOKING_TABS = [
  { value: 'semua', label: 'Semua' },
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'diterima', label: 'Diterima' },
  { value: 'berjalan', label: 'Berjalan' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Dibatalkan/Ditolak' },
];

export const RATING_LABELS = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];

export const REVIEW_MAX = 500;
export const CANCEL_REASON_MAX = 200;

/** Status yang masih boleh dibatalkan pelanggan. */
export const CANCELLABLE = ['menunggu', 'diterima'];

/** Kontak & alamat penyedia hanya terbuka selama pesanan aktif. */
export const CONTACT_VISIBLE = ['diterima', 'berjalan'];

export const SAMPLE_BOOKINGS = [
  {
    code: 'BK-0012',
    providerId: 'rizki-maulana',
    service: 'Layanan Kebersihan Rumah',
    status: 'menunggu',
    mode: 'Penyedia datang ke lokasi Anda',
    date: '2026-10-27',
    start: 9,
    hours: 2,
    unitPrice: 50000,
    unit: 'jam',
    quantity: 2,
    note: 'Fokus bersihkan dapur dan kamar mandi.',
    autoCancelHours: 18,
    unread: false,
    history: [{ status: 'menunggu', by: 'Anda', at: '2026-10-22T19:10' }],
  },
  {
    code: 'BK-0011',
    providerId: 'deni-setiawan',
    service: 'Servis Elektronik',
    status: 'diterima',
    mode: 'Penyedia datang ke lokasi Anda',
    date: '2026-10-24',
    start: 10,
    hours: 2,
    unitPrice: 60000,
    unit: 'jam',
    quantity: 2,
    note: 'Kipas angin berdiri tidak mau berputar dan berbunyi mendengung.',
    contact: {
      phone: '0812-3456-7890',
      whatsapp: '6281234567890',
      address: 'Jl. Cikutra No. 112, Cibeunying Kidul, Kota Bandung, Jawa Barat 40124',
    },
    unread: true,
    history: [
      { status: 'menunggu', by: 'Anda', at: '2026-10-22T14:30' },
      { status: 'diterima', by: 'Penyedia', at: '2026-10-22T16:05' },
    ],
  },
  {
    code: 'BK-0010',
    providerId: 'agus-setiawan',
    service: 'Desain Grafis',
    status: 'berjalan',
    mode: 'Dikerjakan jarak jauh, hasil dikirim lewat WhatsApp',
    date: '2026-10-23',
    start: 9,
    hours: 2,
    unitPrice: 100000,
    unit: 'desain',
    quantity: 1,
    note: 'Logo untuk usaha kue rumahan, warna hijau toska.',
    contact: {
      phone: '0813-2222-4545',
      whatsapp: '6281322224545',
      address: 'Jl. Dipatiukur No. 35, Coblong, Kota Bandung, Jawa Barat 40132',
    },
    unread: true,
    history: [
      { status: 'menunggu', by: 'Anda', at: '2026-10-20T10:00' },
      { status: 'diterima', by: 'Penyedia', at: '2026-10-20T13:15' },
      { status: 'berjalan', by: 'Penyedia', at: '2026-10-23T09:05' },
    ],
  },
  {
    code: 'BK-0009',
    providerId: 'siti-nurjanah',
    service: 'Jahit & Permak Pakaian',
    status: 'selesai',
    mode: 'Anda datang ke lokasi penyedia',
    date: '2026-10-19',
    start: 10,
    hours: 1,
    unitPrice: 35000,
    unit: 'potong',
    quantity: 3,
    note: 'Permak 3 celana panjang, dipotong 4 cm.',
    reviewed: false,
    unread: false,
    history: [
      { status: 'menunggu', by: 'Anda', at: '2026-10-17T08:20' },
      { status: 'diterima', by: 'Penyedia', at: '2026-10-17T09:02' },
      { status: 'berjalan', by: 'Penyedia', at: '2026-10-19T10:05' },
      { status: 'selesai', by: 'Penyedia', at: '2026-10-19T11:40' },
    ],
  },
  {
    code: 'BK-0008',
    providerId: 'lina-kurnia',
    service: 'Kue & Kuliner Rumahan',
    status: 'dibatalkan',
    mode: 'Penyedia mengantar ke lokasi Anda',
    date: '2026-10-16',
    start: 15,
    hours: 1,
    unitPrice: 25000,
    unit: 'pesanan',
    quantity: 4,
    note: 'Snack box untuk arisan.',
    cancelReason: 'Acara arisan diundur ke bulan depan.',
    unread: false,
    history: [
      { status: 'menunggu', by: 'Anda', at: '2026-10-12T09:30' },
      { status: 'diterima', by: 'Penyedia', at: '2026-10-12T11:00' },
      { status: 'dibatalkan', by: 'Anda', at: '2026-10-14T18:45' },
    ],
  },
  {
    code: 'BK-0007',
    providerId: 'rizki-maulana',
    service: 'Layanan Kebersihan Rumah',
    status: 'selesai',
    mode: 'Penyedia datang ke lokasi Anda',
    date: '2026-10-12',
    start: 8,
    hours: 3,
    unitPrice: 50000,
    unit: 'jam',
    quantity: 3,
    note: '',
    reviewed: true,
    unread: false,
    history: [
      { status: 'menunggu', by: 'Anda', at: '2026-10-09T20:00' },
      { status: 'diterima', by: 'Penyedia', at: '2026-10-10T07:30' },
      { status: 'berjalan', by: 'Penyedia', at: '2026-10-12T08:02' },
      { status: 'selesai', by: 'Penyedia', at: '2026-10-12T11:10' },
    ],
  },
  {
    code: 'BK-0006',
    providerId: 'deni-setiawan',
    service: 'Servis Elektronik',
    status: 'selesai',
    mode: 'Penyedia datang ke lokasi Anda',
    date: '2026-09-29',
    start: 13,
    hours: 1,
    unitPrice: 75000,
    unit: 'servis',
    quantity: 1,
    note: 'Rice cooker tidak panas.',
    reviewed: true,
    unread: false,
    history: [
      { status: 'menunggu', by: 'Anda', at: '2026-09-27T16:20' },
      { status: 'diterima', by: 'Penyedia', at: '2026-09-27T17:00' },
      { status: 'berjalan', by: 'Penyedia', at: '2026-09-29T13:05' },
      { status: 'selesai', by: 'Penyedia', at: '2026-09-29T14:00' },
    ],
  },
  {
    code: 'BK-0005',
    providerId: 'fahri-hidayat',
    service: 'Terapi Pijat',
    status: 'ditolak',
    mode: 'Penyedia datang ke lokasi Anda',
    date: '2026-09-21',
    start: 16,
    hours: 1,
    unitPrice: 60000,
    unit: 'jam',
    quantity: 1,
    note: '',
    rejectReason: 'Jadwal penyedia penuh pada tanggal tersebut.',
    unread: false,
    history: [
      { status: 'menunggu', by: 'Anda', at: '2026-09-19T12:00' },
      { status: 'ditolak', by: 'Penyedia', at: '2026-09-19T15:40' },
    ],
  },
];

export const bookingTotal = (booking) => booking.unitPrice * booking.quantity;

/** Pesanan selesai terakhir per penyedia (untuk "Pesan Lagi"). */
export function lastCompletedPerProvider(bookings) {
  const seen = new Set();
  return bookings
    .filter((b) => b.status === 'selesai')
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter((b) => (seen.has(b.providerId) ? false : seen.add(b.providerId)));
}

/** Pesanan yang sedang aktif untuk kartu "Pesanan Aktif" di Beranda. */
export const findActiveBooking = (bookings) =>
  bookings.find((b) => b.status === 'diterima' || b.status === 'berjalan');

export const findBooking = (bookings, code) =>
  bookings.find((b) => b.code.toLowerCase() === String(code).toLowerCase());

/** Pesanan selesai yang belum diulas (untuk "Beri Ulasan" di Beranda). */
export const findReviewable = (bookings) =>
  bookings.find((b) => b.status === 'selesai' && !b.reviewed);

const hourLabel = (hour) => `${String(hour).padStart(2, '0')}.00`;

/** "27 Okt 2026" */
export function formatDay(iso) {
  const date = parseISODate(iso.slice(0, 10));
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

/** "Sel, 27 Okt 2026" */
const formatShortDay = (iso) => `${WEEKDAY_SHORT[parseISODate(iso).getDay()]}, ${formatDay(iso)}`;

/** "Sel, 27 Okt 2026 · 09.00 WIB" */
export const formatBookingDate = (b) => `${formatShortDay(b.date)} · ${hourLabel(b.start)} WIB`;

/** "Sel, 27 Okt 2026 · 09.00–11.00" */
export const formatBookingRange = (b) =>
  `${formatShortDay(b.date)} · ${hourLabel(b.start)}–${hourLabel(b.start + b.hours)}`;

/** "Senin, 19 Oktober 2026 · 10.00 WIB" */
export const formatBookingLong = (b) =>
  `${formatLongDate(parseISODate(b.date))} · ${hourLabel(b.start)} WIB`;

/** "19 Okt 2026, 11.40 WIB" (dari stempel `YYYY-MM-DDTHH:mm`) */
export const formatStamp = (at) => `${formatDay(at)}, ${at.slice(11, 13)}.${at.slice(14, 16)} WIB`;

/** Kode pesanan berikutnya: BK-0012 → BK-0013. TODO(API): kode dibuat backend. */
export function nextBookingCode(bookings) {
  const max = Math.max(0, ...bookings.map((b) => Number(b.code.replace(/\D/g, '')) || 0));
  return `BK-${String(max + 1).padStart(4, '0')}`;
}
