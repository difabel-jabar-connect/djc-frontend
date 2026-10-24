import { addDays, startOfDay } from '@/features/booking/schedule';

/**
 * Data contoh Dashboard Penyedia (desain HTML Dashboard Penyedia) untuk Deni Setiawan.
 * Layanan pesanan diselaraskan dengan kategori Deni (Servis Elektronik), dan tanggal
 * pesanan dibuat relatif terhadap hari ini agar jadwal mingguan selalu relevan.
 * Ganti dengan API pesanan & statistik penyedia setelah endpoint tersedia.
 */

export const PROVIDER_ID = 'deni-setiawan';

export const ORDER_STATUS = {
  baru: { label: 'Baru', tone: 'danger', action: 'Terima', next: 'diproses' },
  menunggu: { label: 'Menunggu Konfirmasi', tone: 'warning', action: 'Proses', next: 'diproses' },
  diproses: { label: 'Diproses', tone: 'info', action: 'Selesai', next: 'selesai' },
  selesai: { label: 'Selesai', tone: 'success' },
};

/** Pesanan contoh; `dayOffset` relatif terhadap `today`. */
export function sampleOrders(today = startOfDay(new Date())) {
  return [
    {
      id: 'o1',
      customer: 'Siti Nurjanah',
      initials: 'SN',
      color: '#0c7272',
      city: 'Depok',
      service: 'Servis TV',
      dayOffset: 0,
      start: 10,
      hours: 2,
      status: 'baru',
      address: 'Jl. Margonda Raya No. 21, Depok',
      note: 'Gambar TV bergaris setelah mati lampu.',
    },
    {
      id: 'o2',
      customer: 'Rizky Pratama',
      initials: 'RP',
      color: '#1d4ed8',
      city: 'Bekasi',
      service: 'Servis Kipas Angin',
      dayOffset: 1,
      start: 14,
      hours: 2,
      status: 'menunggu',
      address: 'Perum Harapan Indah Blok C3, Bekasi',
      note: '',
    },
    {
      id: 'o3',
      customer: 'Lina Kurnia',
      initials: 'LK',
      color: '#6d28d9',
      city: 'Tasikmalaya',
      service: 'Servis Rice Cooker',
      dayOffset: 2,
      start: 9,
      hours: 2,
      status: 'baru',
      address: 'Jl. HZ Mustofa No. 8, Tasikmalaya',
      note: 'Tidak bisa masuk mode memasak.',
    },
    {
      id: 'o4',
      customer: 'Andi Saputra',
      initials: 'AS',
      color: '#9a3412',
      city: 'Bekasi',
      service: 'Servis Elektronik',
      dayOffset: 3,
      start: 13,
      hours: 2,
      status: 'menunggu',
      address: 'Jl. Ahmad Yani No. 45, Bekasi',
      note: '',
    },
    {
      id: 'o5',
      customer: 'Maya Sari',
      initials: 'MS',
      color: '#be185d',
      city: 'Bandung',
      service: 'Servis Mesin Cuci',
      dayOffset: 4,
      start: 8,
      hours: 2,
      status: 'diproses',
      address: 'Jl. Dago No. 101, Bandung',
      note: 'Mesin cuci bocor di bagian bawah.',
    },
  ].map((order) => ({ ...order, date: addDays(today, order.dayOffset) }));
}

export const MONTH_STATS = {
  orders: { value: 12, trend: '+33%' },
  services: { active: 4, total: 5 },
  income: { value: 1250000, trend: '+25%' },
};

/** Pesanan harian 7 hari terakhir (hari ini = indeks terakhir). */
export const LAST_7_DAYS = [0, 1, 1, 2, 1, 2, 3];
export const TREND_TOTALS = {
  orders: { value: 68, trend: '+32%' },
  income: { value: 6440000, trend: '+28%' },
};

/** Kelengkapan profil; `weight` dalam persen (total 100). */
export const PROFILE_CHECKLIST = [
  { label: 'Foto/Avatar profil', weight: 20, done: true },
  { label: 'Informasi dasar', weight: 30, done: true },
  { label: 'Deskripsi layanan', weight: 35, done: true },
  { label: 'Portofolio hasil kerja', weight: 15, done: false },
];

export const profileCompleteness = (items = PROFILE_CHECKLIST) =>
  items.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);
