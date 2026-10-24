/**
 * Data contoh Dashboard Pengelola (desain HTML Dashboard Pengelola).
 * Nama & keahlian alumni diselaraskan dengan data contoh penyedia lain di aplikasi.
 * Ganti dengan API statistik program setelah endpoint tersedia.
 */

export const ADMIN_USER = {
  name: 'Andi Pratama',
  firstName: 'Andi',
  initials: 'AP',
  role: 'Admin UPTD PPSGHD',
  color: '#0b3c6e',
};

export const PERIOD = { label: '1 Jan 2026 – 31 Des 2026', year: 2026 };

export const MONTHS = [
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

/** null = bulan yang belum berjalan. */
export const ALUMNI_PER_MONTH = [
  1420,
  1480,
  1540,
  1610,
  1690,
  1770,
  1860,
  1960,
  2095,
  2346,
  null,
  null,
];
export const ORDERS_PER_MONTH = [40, 52, 60, 68, 76, 84, 92, 108, 120, 192, null, null];

export const PROGRAM_STATS = {
  alumni: { value: 2346, trend: '+12%' },
  services: { value: 124, trend: '+8%' },
  orders: { value: 892, trend: '+24%' },
  cities: { value: 22, trend: '+4 kota' },
};

export const SERVICE_MAP_CITIES = [
  { city: 'Bekasi', x: 176, y: 102 },
  { city: 'Karawang', x: 247, y: 116 },
  { city: 'Indramayu', x: 488, y: 124 },
  { city: 'Bogor', x: 128, y: 187 },
  { city: 'Cirebon', x: 542, y: 214 },
  { city: 'Sukabumi', x: 159, y: 263 },
  { city: 'Bandung', x: 320, y: 261, primary: true },
  { city: 'Tasikmalaya', x: 450, y: 362 },
  { city: 'Ciamis', x: 510, y: 352 },
];

export const LATEST_ALUMNI = [
  {
    name: 'Rizki Maulana',
    initials: 'RM',
    color: '#0b3c6e',
    city: 'Bandung',
    skill: 'Layanan Kebersihan',
    status: 'aktif',
    joined: '12 Okt 2026',
  },
  {
    name: 'Siti Nurjanah',
    initials: 'SN',
    color: '#0c7272',
    city: 'Depok',
    skill: 'Jahit & Permak',
    status: 'aktif',
    joined: '10 Okt 2026',
  },
  {
    name: 'Deni Setiawan',
    initials: 'DS',
    color: '#9a3412',
    city: 'Bekasi',
    skill: 'Servis Elektronik',
    status: 'aktif',
    joined: '08 Okt 2026',
  },
  {
    name: 'Lina Kurnia',
    initials: 'LK',
    color: '#6d28d9',
    city: 'Tasikmalaya',
    skill: 'Kue & Kuliner',
    status: 'aktif',
    joined: '05 Okt 2026',
  },
  {
    name: 'Ahmad Fauzi',
    initials: 'AF',
    color: '#1d4ed8',
    city: 'Cirebon',
    skill: 'Terapi Pijat',
    status: 'verifikasi',
    joined: '02 Okt 2026',
  },
];

export const LATEST_SERVICES = [
  {
    title: 'Servis Laptop',
    category: 'Elektronik',
    slug: 'servis-elektronik',
    provider: 'Deni S.',
    status: 'aktif',
  },
  {
    title: 'Kue & Roti Rumahan',
    category: 'Kuliner',
    slug: 'kuliner',
    provider: 'Lina K.',
    status: 'aktif',
  },
  {
    title: 'Jahit & Permak Pakaian',
    category: 'Jahit',
    slug: 'jahit',
    provider: 'Siti N.',
    status: 'aktif',
  },
  {
    title: 'Terapi Pijat Tradisional',
    category: 'Terapi',
    slug: 'terapi',
    provider: 'Ahmad F.',
    status: 'verifikasi',
  },
  {
    title: 'Desain Grafis',
    category: 'Desain',
    slug: 'desain',
    provider: 'Agus S.',
    status: 'aktif',
  },
];

export const VERIFICATION = { pending: 18, needsFix: 6, verified: 320, rejected: 3 };

export const TARGET = { label: 'Target 2026', goal: 2500, achieved: 2346 };
