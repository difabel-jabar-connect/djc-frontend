/**
 * Data contoh Panel Pengelola UPTD PPSGHD (desain Pengelola: Data Alumni, Detail Alumni,
 * Data Layanan, Wilayah, Verifikasi · Perlu Perbaikan, Laporan).
 * Semua waktu ISO dengan zona WIB (+07:00). Ganti dengan API pengelola setelah tersedia.
 */

/* ———————————————————————— Alumni ———————————————————————— */

/** Data minimum profil penyedia (PRD) — 10 butir kelengkapan. */
export const PROFILE_FIELDS = [
  { key: 'photo', label: 'Foto/avatar profil' },
  { key: 'name', label: 'Nama' },
  { key: 'description', label: 'Deskripsi singkat' },
  { key: 'skill', label: 'Jenis keterampilan' },
  { key: 'service', label: 'Jenis jasa' },
  { key: 'price', label: 'Harga' },
  { key: 'location', label: 'Lokasi (titik koordinat)' },
  { key: 'schedule', label: 'Jam/ketersediaan' },
  { key: 'rating', label: 'Rating' },
  { key: 'reviews', label: 'Ulasan' },
];

export const ALUMNI_STATUS = {
  terverifikasi: { label: 'Terverifikasi', tone: 'success' },
  perbaikan: { label: 'Perlu Perbaikan Data', tone: 'orange' },
};

/** Angka agregat seluruh program (bukan hanya data contoh di tabel). */
export const PROGRAM_STATS = {
  registered: 347,
  verified: 320,
  withActiveService: 124,
  totalOrders: 892,
  target: { label: 'Target alumni aktif 2026', value: 2346, goal: 2500 },
};

/** Riwayat status akun bawaan bila data detail belum lengkap. */
const defaultHistory = (status, joinedAt) => {
  const at = (hours) => new Date(new Date(joinedAt).getTime() + hours * 3600000).toISOString();
  const verified =
    status === 'terverifikasi'
      ? [
          {
            status: 'terverifikasi',
            at: at(26),
            by: 'Andi Pratama',
            reason: 'Data lengkap dan bukti alumni valid.',
          },
        ]
      : [
          {
            status: 'perbaikan',
            at: at(20),
            by: 'Rina Kartika',
            reason: 'Data belum lengkap, mohon dilengkapi.',
          },
        ];
  return [
    ...verified,
    { status: 'menunggu', at: joinedAt, by: 'Sistem', reason: 'Pendaftaran dikirim.' },
  ];
};

const alumnus = (data) => {
  const completed = data.completed ?? 0;
  return {
    status: 'terverifikasi',
    missing: [],
    radiusKm: 10,
    workDays: [1, 2, 3, 4, 5, 6],
    hours: '08.00 – 17.00 WIB',
    breakTime: '12.00 – 13.00 WIB',
    orderStats: {
      menunggu: completed ? 1 : 0,
      diterima: completed ? 1 : 0,
      berjalan: 0,
      selesai: completed,
      ditolak: completed > 20 ? 1 : 0,
      dibatalkan: completed > 10 ? 1 : 0,
    },
    monthly: [0.12, 0.15, 0.17, 0.16, 0.19, 0.21].map((share) => Math.round(completed * share)),
    reviews: [],
    revisionRequest: null,
    ...data,
    history: data.history ?? defaultHistory(data.status ?? 'terverifikasi', data.joinedAt),
  };
};

export const SAMPLE_ALUMNI = [
  alumnus({
    id: 'rizki-maulana',
    name: 'Rizki Maulana',
    initials: 'RM',
    color: '#0b3c6e',
    category: 'servis-elektronik',
    city: 'Kota Bandung',
    rating: 4.9,
    reviewCount: 32,
    completed: 41,
    missing: ['photo'],
    joinedAt: '2026-02-14T19:02:00+07:00',
    email: 'rizki.maulana@email.com',
    phone: '+62 812-3456-7890',
    address: 'Jl. Cikutra No. 41, Cibeunying Kidul, Kota Bandung, Jawa Barat',
    coords: { lat: -6.9175, lng: 107.6191 },
    description:
      'Servis laptop, komputer, dan elektronik rumah tangga. Lulusan pelatihan elektronika UPTD PPSGHD 2021.',
    orderStats: { menunggu: 1, diterima: 1, berjalan: 0, selesai: 41, ditolak: 2, dibatalkan: 1 },
    monthly: [5, 6, 8, 7, 9, 11],
    reviews: [
      {
        rating: 5,
        text: 'Laptop yang mati total bisa nyala lagi dalam sehari. Penjelasannya sabar dan jelas.',
        by: 'Budi Santoso',
        code: 'BK-0011',
        at: '2026-10-26T15:00:00+07:00',
      },
      {
        rating: 5,
        text: 'Rice cooker kembali normal, harga sesuai estimasi di awal.',
        by: 'Rina Agustina',
        code: 'BK-0006',
        at: '2026-10-12T11:00:00+07:00',
      },
      {
        rating: 4,
        text: 'Hasil bagus, hanya datang 15 menit lebih lambat dari jadwal.',
        by: 'Dedi Kurniawan',
        code: 'BK-0002',
        at: '2026-10-03T16:00:00+07:00',
      },
    ],
    history: [
      {
        status: 'terverifikasi',
        at: '2026-02-15T10:20:00+07:00',
        by: 'Andi Pratama',
        reason: 'Data lengkap dan bukti alumni valid.',
      },
      {
        status: 'diperbarui',
        at: '2026-02-15T08:10:00+07:00',
        by: 'Rizki Maulana',
        reason: 'Titik lokasi ditambahkan.',
      },
      {
        status: 'perbaikan',
        at: '2026-02-14T21:00:00+07:00',
        by: 'Rina Kartika',
        reason: 'Titik lokasi belum ditentukan.',
      },
      {
        status: 'menunggu',
        at: '2026-02-14T19:02:00+07:00',
        by: 'Sistem',
        reason: 'Pendaftaran dikirim.',
      },
    ],
  }),
  alumnus({
    id: 'siti-nurjanah',
    name: 'Siti Nurjanah',
    initials: 'SN',
    color: '#0c7272',
    category: 'jahit',
    city: 'Kota Depok',
    rating: 4.8,
    reviewCount: 27,
    completed: 35,
    joinedAt: '2026-01-20T09:00:00+07:00',
    email: 'siti.nurjanah@email.com',
    phone: '+62 813-1122-3344',
    address: 'Jl. Margonda Raya No. 12, Beji, Kota Depok, Jawa Barat',
    coords: { lat: -6.3725, lng: 106.8324 },
    description: 'Permak, jahit custom, dan busana muslim. Alumni program menjahit 2020.',
    reviews: [
      {
        rating: 5,
        text: 'Gamisnya pas sekali dan jahitannya rapi.',
        by: 'Sari Wahyuni',
        code: 'BK-0009',
        at: '2026-10-20T10:00:00+07:00',
      },
    ],
  }),
  alumnus({
    id: 'deni-setiawan',
    name: 'Deni Setiawan',
    initials: 'DS',
    color: '#9a3412',
    category: 'servis-elektronik',
    city: 'Kota Bekasi',
    rating: 4.7,
    reviewCount: 21,
    completed: 28,
    missing: ['photo'],
    joinedAt: '2026-02-14T10:00:00+07:00',
    email: 'deni.setiawan@email.com',
    phone: '+62 821-5566-7788',
    address: 'Jl. Ahmad Yani No. 5, Bekasi Selatan, Kota Bekasi, Jawa Barat',
    coords: { lat: -6.2383, lng: 106.9756 },
    description: 'Servis kipas, rice cooker, dan TV. Alumni program elektronika 2021.',
  }),
  alumnus({
    id: 'lina-kurnia',
    name: 'Lina Kurnia',
    initials: 'LK',
    color: '#6d28d9',
    category: 'kuliner',
    city: 'Kota Tasikmalaya',
    rating: 4.9,
    reviewCount: 19,
    completed: 24,
    joinedAt: '2026-02-02T09:30:00+07:00',
    email: 'lina.kurnia@email.com',
    phone: '+62 852-3344-5566',
    address: 'Jl. HZ Mustofa No. 30, Cihideung, Kota Tasikmalaya, Jawa Barat',
    coords: { lat: -7.3274, lng: 108.2207 },
    description: 'Kue rumahan, bolu, dan nasi tumpeng mini untuk acara keluarga.',
  }),
  alumnus({
    id: 'agus-setiawan',
    name: 'Agus Setiawan',
    initials: 'AS',
    color: '#1d4ed8',
    category: 'desain',
    city: 'Kab. Bogor',
    rating: 4.6,
    reviewCount: 14,
    completed: 17,
    status: 'perbaikan',
    missing: ['photo', 'location', 'schedule'],
    joinedAt: '2026-03-03T10:00:00+07:00',
    email: 'agus.setiawan@email.com',
    phone: '+62 811-9988-7766',
    address: 'Cibinong, Kab. Bogor, Jawa Barat (titik lokasi belum ditentukan)',
    coords: null,
    description: 'Desain logo, poster, dan materi promosi untuk UMKM.',
  }),
  alumnus({
    id: 'wawan-permana',
    name: 'Wawan Permana',
    initials: 'WP',
    color: '#0e7490',
    category: 'kebersihan',
    city: 'Kab. Sumedang',
    rating: 4.7,
    reviewCount: 12,
    completed: 15,
    joinedAt: '2026-03-11T08:00:00+07:00',
    email: 'wawan.permana@email.com',
    phone: '+62 857-1212-3434',
    address: 'Jl. Prabu Geusan Ulun No. 4, Sumedang Utara, Kab. Sumedang, Jawa Barat',
    coords: { lat: -6.8382, lng: 107.9262 },
    description: 'Bersih-bersih rumah, kantor, dan kos dengan alat sendiri.',
  }),
  alumnus({
    id: 'fahri-hidayat',
    name: 'Fahri Hidayat',
    initials: 'FH',
    color: '#b45309',
    category: 'terapi',
    city: 'Kota Cimahi',
    rating: 4.5,
    reviewCount: 11,
    completed: 13,
    missing: ['photo'],
    joinedAt: '2026-03-24T13:00:00+07:00',
    email: 'fahri.hidayat@email.com',
    phone: '+62 838-7766-5544',
    address: 'Jl. Gatot Subroto No. 9, Cimahi Tengah, Kota Cimahi, Jawa Barat',
    coords: { lat: -6.8722, lng: 107.5425 },
    description: 'Pijat refleksi dan relaksasi, bisa datang ke rumah.',
  }),
  alumnus({
    id: 'nining-kurniasih',
    name: 'Nining Kurniasih',
    initials: 'NK',
    color: '#be185d',
    category: 'jahit',
    city: 'Kab. Karawang',
    rating: 4.8,
    reviewCount: 9,
    completed: 11,
    missing: ['photo'],
    joinedAt: '2026-04-06T09:00:00+07:00',
    email: 'nining.kurniasih@email.com',
    phone: '+62 813-4545-6767',
    address: 'Jl. Tuparev No. 77, Karawang Barat, Kab. Karawang, Jawa Barat',
    coords: { lat: -6.3063, lng: 107.2964 },
    description: 'Jahit seragam sekolah dan kantor dalam jumlah kecil.',
  }),
  alumnus({
    id: 'hana-safitri',
    name: 'Hana Safitri',
    initials: 'HS',
    color: '#374151',
    category: 'kuliner',
    city: 'Kota Cirebon',
    rating: 4.4,
    reviewCount: 8,
    completed: 9,
    status: 'perbaikan',
    missing: ['photo', 'location', 'price'],
    joinedAt: '2026-05-19T10:00:00+07:00',
    email: 'hana.safitri@email.com',
    phone: '+62 856-1010-2020',
    address: 'Kejaksan, Kota Cirebon, Jawa Barat (titik lokasi belum ditentukan)',
    coords: null,
    description: 'Katering nasi kotak untuk acara kantor dan pengajian.',
  }),
  alumnus({
    id: 'yuni-astuti',
    name: 'Yuni Astuti',
    initials: 'YA',
    color: '#0c7272',
    category: 'kebersihan',
    city: 'Kab. Garut',
    rating: null,
    reviewCount: 0,
    completed: 0,
    joinedAt: '2026-10-21T09:00:00+07:00',
    email: 'yuni.astuti@email.com',
    phone: '+62 822-3030-4040',
    address: 'Jl. Ciledug No. 15, Garut Kota, Kab. Garut, Jawa Barat',
    coords: { lat: -7.2167, lng: 107.9 },
    description: 'Bersih rumah harian dan cuci karpet.',
  }),
  alumnus({
    id: 'dodi-firmansyah',
    name: 'Dodi Firmansyah',
    initials: 'DF',
    color: '#9a3412',
    category: 'servis-elektronik',
    city: 'Kab. Subang',
    rating: 4.6,
    reviewCount: 5,
    completed: 6,
    status: 'perbaikan',
    missing: ['photo', 'location'],
    joinedAt: '2026-06-02T09:00:00+07:00',
    email: 'dodi.firmansyah@email.com',
    phone: '+62 812-6060-7070',
    address: 'Subang, Kab. Subang, Jawa Barat (titik lokasi belum ditentukan)',
    coords: null,
    description: 'Servis elektronik rumah tangga dan instalasi antena.',
  }),
];

/** Jumlah butir profil yang terisi (dari 10). */
export const profileScore = (alumni) => PROFILE_FIELDS.length - alumni.missing.length;

/* ———————————————————————— Layanan ———————————————————————— */

export const SERVICE_STATUS = {
  aktif: { label: 'Aktif', tone: 'success' },
  disembunyikan: { label: 'Disembunyikan', tone: 'neutral' },
  nonaktif: { label: 'Nonaktif oleh Penyedia', tone: 'neutral' },
};

export const PRICE_RANGES = [
  { value: '', label: 'Semua' },
  { value: 'lt50', label: '< Rp50.000', test: (p) => p < 50000 },
  { value: '50to100', label: 'Rp50.000 – Rp100.000', test: (p) => p >= 50000 && p <= 100000 },
  { value: 'gt100', label: '> Rp100.000', test: (p) => p > 100000 },
];

const service = (data) => ({
  status: 'aktif',
  hidden: null,
  duration: '1–2 jam',
  mode: 'Penyedia datang ke lokasi',
  rating: null,
  reviews: 0,
  orders: 0,
  ...data,
});

export const SAMPLE_SERVICES = [
  service({
    id: 's-laptop',
    name: 'Servis Laptop & Komputer',
    category: 'servis-elektronik',
    provider: 'rizki-maulana',
    price: 75000,
    unit: 'pesanan',
    rating: 4.9,
    reviews: 18,
    orders: 22,
    updatedAt: '2026-10-26T09:00:00+07:00',
    duration: '1–3 hari kerja',
    mode: 'Diantar ke lokasi penyedia',
    description: 'Perbaikan laptop dan PC: instal ulang, ganti komponen, dan pembersihan.',
  }),
  service({
    id: 's-permak',
    name: 'Jahit & Permak Pakaian',
    category: 'jahit',
    provider: 'siti-nurjanah',
    price: 25000,
    unit: 'item',
    rating: 4.8,
    reviews: 16,
    orders: 19,
    updatedAt: '2026-10-24T10:00:00+07:00',
    duration: '2–3 hari',
    mode: 'Diantar ke lokasi penyedia',
    description: 'Permak celana, kemeja, dan gamis. Potong, kecilkan, atau ganti resleting.',
  }),
  service({
    id: 's-kue',
    name: 'Kue & Roti Rumahan',
    category: 'kuliner',
    provider: 'lina-kurnia',
    price: 45000,
    unit: 'pesanan',
    rating: 4.9,
    reviews: 12,
    orders: 14,
    updatedAt: '2026-10-23T08:00:00+07:00',
    duration: 'Pesan H-1',
    mode: 'Diantar ke rumah',
    description: 'Bolu pandan, roti sobek, dan kue basah untuk arisan atau acara keluarga.',
  }),
  service({
    id: 's-bersih',
    name: 'Kebersihan Rumah',
    category: 'kebersihan',
    provider: 'wawan-permana',
    price: 50000,
    unit: 'jam',
    rating: 4.7,
    reviews: 12,
    orders: 15,
    updatedAt: '2026-10-22T07:00:00+07:00',
    duration: 'Minimal 2 jam',
    description: 'Sapu, pel, lap kaca, dan rapikan ruangan. Alat kebersihan dibawa sendiri.',
  }),
  service({
    id: 's-logo',
    name: 'Desain Logo UMKM',
    category: 'desain',
    provider: 'agus-setiawan',
    price: 150000,
    unit: 'pesanan',
    rating: 4.6,
    reviews: 14,
    orders: 17,
    status: 'disembunyikan',
    hidden: {
      by: 'Andi Pratama',
      at: '2026-10-21T14:30:00+07:00',
      reason: 'Gambar contoh memakai logo merek lain tanpa izin.',
    },
    updatedAt: '2026-10-21T14:30:00+07:00',
    duration: '3–5 hari kerja',
    mode: 'Daring (dikirim lewat WhatsApp/email)',
    description:
      'Desain logo untuk usaha kecil: 3 konsep awal, 2 kali revisi, file PNG dan PDF siap cetak.',
  }),
  service({
    id: 's-kipas-rc',
    name: 'Servis Kipas & Rice Cooker',
    category: 'servis-elektronik',
    provider: 'deni-setiawan',
    price: 50000,
    unit: 'item',
    rating: 4.7,
    reviews: 11,
    orders: 16,
    updatedAt: '2026-10-20T11:00:00+07:00',
    description: 'Perbaikan kipas angin, rice cooker, dan dispenser.',
  }),
  service({
    id: 's-pijat',
    name: 'Pijat Refleksi',
    category: 'terapi',
    provider: 'fahri-hidayat',
    price: 80000,
    unit: 'jam',
    rating: 4.5,
    reviews: 11,
    orders: 13,
    updatedAt: '2026-10-18T13:00:00+07:00',
    description: 'Pijat refleksi kaki dan relaksasi punggung.',
  }),
  service({
    id: 's-listrik',
    name: 'Instalasi Listrik Rumah',
    category: 'servis-elektronik',
    provider: 'rizki-maulana',
    price: 60000,
    unit: 'jam',
    rating: 4.8,
    reviews: 6,
    orders: 9,
    status: 'nonaktif',
    updatedAt: '2026-10-15T09:00:00+07:00',
    description: 'Pasang stop kontak, lampu, dan perbaikan korsleting ringan.',
  }),
  service({
    id: 's-seragam',
    name: 'Jahit Seragam Sekolah',
    category: 'jahit',
    provider: 'nining-kurniasih',
    price: 95000,
    unit: 'item',
    rating: 4.8,
    reviews: 9,
    orders: 11,
    updatedAt: '2026-10-12T10:00:00+07:00',
    duration: '5–7 hari',
    description: 'Jahit seragam sekolah dan kantor, termasuk bordir nama.',
  }),
  service({
    id: 's-katering',
    name: 'Katering Nasi Kotak',
    category: 'kuliner',
    provider: 'hana-safitri',
    price: 22000,
    unit: 'item',
    rating: 4.4,
    reviews: 8,
    orders: 9,
    updatedAt: '2026-10-09T08:00:00+07:00',
    duration: 'Pesan H-2',
    mode: 'Diantar ke lokasi acara',
    description: 'Nasi kotak lengkap untuk acara kantor dan pengajian, minimal 20 kotak.',
  }),
  service({
    id: 's-kipas',
    name: 'Servis Kipas Angin',
    category: 'servis-elektronik',
    provider: 'rizki-maulana',
    price: 50000,
    unit: 'item',
    rating: 4.9,
    reviews: 8,
    orders: 15,
    updatedAt: '2026-10-08T09:00:00+07:00',
    description: 'Servis kipas angin dinding dan berdiri.',
  }),
  service({
    id: 's-gamis',
    name: 'Jahit Gamis',
    category: 'jahit',
    provider: 'siti-nurjanah',
    price: 120000,
    unit: 'item',
    rating: 4.8,
    reviews: 11,
    orders: 16,
    updatedAt: '2026-10-06T09:00:00+07:00',
    duration: '7 hari',
    mode: 'Diantar ke lokasi penyedia',
    description: 'Jahit gamis sesuai ukuran, bahan dari pelanggan.',
  }),
  service({
    id: 's-tumpeng',
    name: 'Nasi Tumpeng Mini',
    category: 'kuliner',
    provider: 'lina-kurnia',
    price: 120000,
    unit: 'pesanan',
    rating: 4.9,
    reviews: 7,
    orders: 10,
    updatedAt: '2026-10-05T08:00:00+07:00',
    duration: 'Pesan H-2',
    mode: 'Diantar ke rumah',
    description: 'Tumpeng mini untuk 10 orang lengkap dengan lauk.',
  }),
  service({
    id: 's-bolu',
    name: 'Bolu & Kue Kering',
    category: 'kuliner',
    provider: 'lina-kurnia',
    price: 60000,
    unit: 'pesanan',
    rating: 4.8,
    reviews: 5,
    orders: 8,
    updatedAt: '2026-10-02T08:00:00+07:00',
    duration: 'Pesan H-1',
    mode: 'Diantar ke rumah',
    description: 'Bolu gulung dan kue kering toples.',
  }),
  service({
    id: 's-kantor',
    name: 'Bersih Kantor',
    category: 'kebersihan',
    provider: 'wawan-permana',
    price: 65000,
    unit: 'jam',
    rating: 4.6,
    reviews: 4,
    orders: 6,
    updatedAt: '2026-09-30T08:00:00+07:00',
    description: 'Kebersihan ruang kantor kecil di luar jam kerja.',
  }),
  service({
    id: 's-tv',
    name: 'Servis TV',
    category: 'servis-elektronik',
    provider: 'deni-setiawan',
    price: 70000,
    unit: 'item',
    rating: 4.7,
    reviews: 6,
    orders: 9,
    updatedAt: '2026-09-28T10:00:00+07:00',
    description: 'Perbaikan TV tabung dan LED.',
  }),
  service({
    id: 's-yuni-rumah',
    name: 'Bersih Rumah Harian',
    category: 'kebersihan',
    provider: 'yuni-astuti',
    price: 45000,
    unit: 'jam',
    updatedAt: '2026-10-21T09:30:00+07:00',
    description: 'Bersih rumah harian, sapu, pel, dan cuci piring.',
  }),
  service({
    id: 's-yuni-karpet',
    name: 'Cuci Karpet',
    category: 'kebersihan',
    provider: 'yuni-astuti',
    price: 15000,
    unit: 'meter',
    updatedAt: '2026-10-21T09:40:00+07:00',
    description: 'Cuci karpet di tempat dengan vakum.',
  }),
];

/** Jumlah pesanan layanan per status (perkiraan dari total pesanan). */
export const serviceOrderStats = (item) => {
  const done = item.orders;
  return {
    menunggu: 0,
    diterima: done ? 1 : 0,
    berjalan: done > 5 ? 1 : 0,
    selesai: done,
    ditolak: 0,
    dibatalkan: done > 10 ? 1 : 0,
  };
};

/* ———————————————————————— Wilayah ———————————————————————— */

/**
 * 27 kota/kabupaten Jawa Barat dengan agregat penyedia, layanan, pesanan, rating,
 * kategori terbanyak, dan bentuk peta ilustrasi (koordinat SVG, viewBox -40 -30 720 560).
 * `fixing` = penyedia di wilayah ini yang berstatus Perlu Perbaikan Data.
 */
export const REGIONS = [
  {
    id: 'kota-bandung',
    name: 'Kota Bandung',
    label: 'Bandung',
    providers: 31,
    services: 52,
    orders: 214,
    rating: 4.8,
    top: 'servis-elektronik',
    fixing: 1,
    shape: 'M315 207.2 L294.9 293.3 L361 285.1 L349.2 208.9 L328.9 201.8 Z',
  },
  {
    id: 'kota-bekasi',
    name: 'Kota Bekasi',
    label: 'Bekasi',
    providers: 12,
    services: 19,
    orders: 138,
    rating: 4.7,
    top: 'kuliner',
    fixing: 0,
    shape: 'M201.6 143.4 L209.4 112.6 L175.6 51.2 L175.6 57.3 L163.8 97.6 L158.3 103.5 Z',
  },
  {
    id: 'kab-bandung',
    name: 'Kab. Bandung',
    providers: 9,
    services: 14,
    orders: 61,
    rating: 4.7,
    top: 'kebersihan',
    fixing: 1,
    shape: 'M268.5 308.8 L268.5 392.5 L389.3 332.1 L393 318 L361 285.1 L294.9 293.3 Z',
  },
  {
    id: 'kota-depok',
    name: 'Kota Depok',
    label: 'Depok',
    providers: 8,
    services: 13,
    orders: 71,
    rating: 4.8,
    top: 'jahit',
    fixing: 0,
    shape: 'M202.9 166 L201.6 143.4 L158.3 103.5 L133.1 130.7 L110.2 132.6 Z',
  },
  {
    id: 'kota-bogor',
    name: 'Kota Bogor',
    label: 'Bogor',
    providers: 7,
    services: 11,
    orders: 52,
    rating: 4.8,
    top: 'jahit',
    fixing: 0,
    shape:
      'M197.8 196.3 L205.3 180.8 L205.1 170.7 L202.9 166 L110.2 132.6 L104.7 133.1 L69.2 135.4 L63.7 138 L141.1 217.4 Z',
  },
  {
    id: 'kota-cimahi',
    name: 'Kota Cimahi',
    providers: 6,
    services: 9,
    orders: 44,
    rating: 4.7,
    top: 'terapi',
    fixing: 0,
    shape: 'M268.5 308.8 L294.9 293.3 L315 207.2 L306.4 208 L243.7 278.9 Z',
  },
  {
    id: 'kab-bekasi',
    name: 'Kab. Bekasi',
    providers: 6,
    services: 9,
    orders: 37,
    rating: 4.6,
    top: 'kebersihan',
    fixing: 0,
    shape: 'M209.4 112.6 L267.3 57.4 L246.6 38.4 L211.1 33.7 L175.6 28.9 L175.6 51.2 Z',
  },
  {
    id: 'kab-bogor',
    name: 'Kab. Bogor',
    providers: 6,
    services: 8,
    orders: 34,
    rating: 4.6,
    top: 'desain',
    fixing: 1,
    shape: 'M107.4 260.5 L141.1 217.4 L63.7 138 L33.7 152 L28.9 182.7 L33.7 223 L29 269.5 Z',
  },
  {
    id: 'kota-cirebon',
    name: 'Kota Cirebon',
    label: 'Cirebon',
    providers: 5,
    services: 7,
    orders: 33,
    rating: 4.6,
    top: 'kuliner',
    fixing: 1,
    shape:
      'M510.4 175.6 L571.8 245.8 L602.8 245.1 L606.3 230.1 L577.9 211.1 L549.5 192.2 L530.6 159.1 L526.3 152.6 Z',
  },
  {
    id: 'kota-tasikmalaya',
    name: 'Kota Tasikmalaya',
    label: 'Tasikmalaya',
    providers: 5,
    services: 8,
    orders: 40,
    rating: 4.8,
    top: 'kuliner',
    fixing: 0,
    shape: 'M410.4 379.7 L483.4 392.6 L480.7 311.5 L430.6 297.1 L393 318 L389.3 332.1 Z',
  },
  {
    id: 'kab-bandung-barat',
    name: 'Kab. Bandung Barat',
    providers: 4,
    services: 6,
    orders: 22,
    rating: 4.6,
    top: 'kebersihan',
    fixing: 0,
    shape: 'M197.8 196.3 L218.9 264.5 L243.7 278.9 L306.4 208 L205.3 180.8 Z',
  },
  {
    id: 'kab-karawang',
    name: 'Kab. Karawang',
    label: 'Karawang',
    providers: 4,
    services: 6,
    orders: 28,
    rating: 4.7,
    top: 'jahit',
    fixing: 0,
    shape:
      'M202.9 166 L205.1 170.7 L310 115.2 L318.8 89.3 L294 81 L275 64.4 L267.3 57.4 L209.4 112.6 L201.6 143.4 Z',
  },
  {
    id: 'kab-sumedang',
    name: 'Kab. Sumedang',
    label: 'Sumedang',
    providers: 4,
    services: 6,
    orders: 26,
    rating: 4.7,
    top: 'kebersihan',
    fixing: 0,
    shape: 'M361 285.1 L393 318 L430.6 297.1 L444.3 201.9 L417.7 184.1 L349.2 208.9 Z',
  },
  {
    id: 'kab-cianjur',
    name: 'Kab. Cianjur',
    label: 'Cianjur',
    providers: 4,
    services: 5,
    orders: 11,
    rating: 4.5,
    top: 'kuliner',
    fixing: 0,
    shape:
      'M158.5 377.2 L211.1 388.6 L263.2 403.2 L268.5 392.5 L268.5 308.8 L243.7 278.9 L218.9 264.5 L158.5 315.2 Z',
  },
  {
    id: 'kab-garut',
    name: 'Kab. Garut',
    label: 'Garut',
    providers: 3,
    services: 5,
    orders: 24,
    rating: 4.6,
    top: 'kebersihan',
    fixing: 0,
    shape:
      'M410.4 379.7 L389.3 332.1 L268.5 392.5 L263.2 403.2 L270.3 405.2 L329.5 428.9 L384.8 451 Z',
  },
  {
    id: 'kab-cirebon',
    name: 'Kab. Cirebon',
    providers: 3,
    services: 4,
    orders: 18,
    rating: 4.6,
    top: 'kuliner',
    fixing: 0,
    shape: 'M521.6 272.4 L571.8 245.8 L510.4 175.6 L472.5 200.1 Z',
  },
  {
    id: 'kota-sukabumi',
    name: 'Kota Sukabumi',
    label: 'Sukabumi',
    providers: 2,
    services: 3,
    orders: 12,
    rating: 4.5,
    top: 'servis-elektronik',
    fixing: 0,
    shape: 'M141.1 217.4 L107.4 260.5 L158.5 315.2 L218.9 264.5 L197.8 196.3 Z',
  },
  {
    id: 'kab-sukabumi',
    name: 'Kab. Sukabumi',
    providers: 1,
    services: 2,
    orders: 9,
    rating: 4.4,
    top: 'kebersihan',
    fixing: 0,
    shape:
      'M158.5 315.2 L107.4 260.5 L29 269.5 L28.9 270.3 L38.4 317.6 L57.3 357.9 L104.7 372.1 L156.7 376.8 L158.5 377.2 Z',
  },
  {
    id: 'kab-purwakarta',
    name: 'Kab. Purwakarta',
    providers: 1,
    services: 2,
    orders: 8,
    rating: 4.5,
    top: 'jahit',
    fixing: 0,
    shape: 'M315 207.2 L328.9 201.8 L310 115.2 L205.1 170.7 L205.3 180.8 L306.4 208 Z',
  },
  {
    id: 'kab-indramayu',
    name: 'Kab. Indramayu',
    label: 'Indramayu',
    providers: 1,
    services: 1,
    orders: 6,
    rating: 4.3,
    top: 'kuliner',
    fixing: 0,
    shape:
      'M417.7 184.1 L444.3 201.9 L472.5 200.1 L510.4 175.6 L526.3 152.6 L502.2 116.5 L483.3 97.6 L447.8 104.7 L410.1 99 Z',
  },
  {
    id: 'kab-tasikmalaya',
    name: 'Kab. Tasikmalaya',
    providers: 1,
    services: 2,
    orders: 10,
    rating: 4.6,
    top: 'kuliner',
    fixing: 0,
    shape: 'M493.2 402.7 L483.4 392.6 L410.4 379.7 L384.8 451 L388.6 452.5 L436 466.7 L478.9 471 Z',
  },
  {
    id: 'kab-ciamis',
    name: 'Kab. Ciamis',
    label: 'Ciamis',
    providers: 1,
    services: 1,
    orders: 7,
    rating: 4.5,
    top: 'kerajinan',
    fixing: 0,
    shape: 'M480.7 311.5 L483.4 392.6 L493.2 402.7 L512.5 397.8 L552.7 334.6 L512 299.4 Z',
  },
  {
    id: 'kab-subang',
    name: 'Kab. Subang',
    label: 'Subang',
    providers: 0,
    services: 0,
    orders: 0,
    rating: null,
    top: null,
    fixing: 0,
    shape:
      'M310 115.2 L328.9 201.8 L349.2 208.9 L417.7 184.1 L410.1 99 L400.5 97.6 L365 88.1 L329.5 92.8 L318.8 89.3 Z',
  },
  {
    id: 'kab-majalengka',
    name: 'Kab. Majalengka',
    providers: 0,
    services: 0,
    orders: 0,
    rating: null,
    top: null,
    fixing: 0,
    shape: 'M512 299.4 L521.6 272.4 L472.5 200.1 L444.3 201.9 L430.6 297.1 L480.7 311.5 Z',
  },
  {
    id: 'kab-kuningan',
    name: 'Kab. Kuningan',
    providers: 0,
    services: 0,
    orders: 0,
    rating: null,
    top: null,
    fixing: 0,
    shape:
      'M571.8 245.8 L521.6 272.4 L512 299.4 L552.7 334.6 L600.2 337.9 L587.4 305.8 L596.9 270.3 L602.8 245.1 Z',
  },
  {
    id: 'kota-banjar',
    name: 'Kota Banjar',
    providers: 0,
    services: 0,
    orders: 0,
    rating: null,
    top: null,
    fixing: 0,
    shape:
      'M552.7 334.6 L512.5 397.8 L589.2 423.8 L592.1 419.4 L606.3 376.8 L601.6 341.3 L600.2 337.9 Z',
  },
  {
    id: 'kab-pangandaran',
    name: 'Kab. Pangandaran',
    label: 'Pangandaran',
    providers: 0,
    services: 0,
    orders: 0,
    rating: null,
    top: null,
    fixing: 0,
    shape:
      'M512.5 397.8 L493.2 402.7 L478.9 471 L483.3 471.5 L530.6 466.7 L573.2 447.8 L589.2 423.8 Z',
  },
];

/** Garis batas provinsi untuk peta ilustrasi. */
export const PROVINCE_OUTLINE =
  'M33.7 152 L69.2 135.4 L104.7 133.1 L133.1 130.7 L163.8 97.6 L175.6 57.3 L175.6 28.9 L211.1 33.7 L246.6 38.4 L275 64.4 L294 81 L329.5 92.8 L365 88.1 L400.5 97.6 L447.8 104.7 L483.3 97.6 L502.2 116.5 L530.6 159.1 L549.5 192.2 L577.9 211.1 L606.3 230.1 L596.9 270.3 L587.4 305.8 L601.6 341.3 L606.3 376.8 L592.1 419.4 L573.2 447.8 L530.6 466.7 L483.3 471.5 L436 466.7 L388.6 452.5 L329.5 428.9 L270.3 405.2 L211.1 388.6 L156.7 376.8 L104.7 372.1 L57.3 357.9 L38.4 317.6 L28.9 270.3 L33.7 223 L28.9 182.7 Z';

/** Lima tingkat kepadatan pesanan (legenda peta). */
export const DENSITY_LEVELS = [
  { min: 0, max: 0, label: '0', color: '#e8f3fa' },
  { min: 1, max: 14, label: '1–14', color: '#b6d4e8' },
  { min: 15, max: 34, label: '15–34', color: '#6fa8cf' },
  { min: 35, max: 79, label: '35–79', color: '#2f6fa3' },
  { min: 80, max: Infinity, label: '80+', color: '#0b3c6e' },
];

export const densityLevel = (orders) =>
  DENSITY_LEVELS.findIndex((level) => orders >= level.min && orders <= level.max);

/** Titik tengah kasar sebuah bentuk SVG (rata-rata titik sudutnya). */
export function shapeCenter(shape) {
  const nums = shape.match(/-?\d+(\.\d+)?/g).map(Number);
  let x = 0;
  let y = 0;
  for (let i = 0; i < nums.length; i += 2) {
    x += nums[i];
    y += nums[i + 1];
  }
  const n = nums.length / 2;
  return [x / n, y / n];
}

/** Warna titik tengah pin per kategori (legenda peta). */
export const CATEGORY_COLORS = {
  kebersihan: '#0891b2',
  'servis-elektronik': '#7c3aed',
  jahit: '#db2777',
  kuliner: '#ea580c',
  desain: '#16a34a',
  terapi: '#ca8a04',
  kerajinan: '#64748b',
};

const CATEGORY_ORDER = ['kebersihan', 'servis-elektronik', 'jahit', 'kuliner', 'desain', 'terapi'];

/**
 * Sebaran penyedia per wilayah: satu entri per penyedia (kategori + status) agar filter
 * peta bisa dihitung. Penyedia contoh yang punya titik lokasi memakai identitas aslinya.
 */
export function buildMapProviders(regions = REGIONS, alumni = SAMPLE_ALUMNI) {
  const list = [];
  regions.forEach((region) => {
    const named = alumni.filter((a) => a.city === region.name && a.coords);
    named.forEach((a) =>
      list.push({ region: region.id, category: a.category, status: a.status, alumni: a.id }),
    );
    const rest = region.providers - named.length;
    const others = CATEGORY_ORDER.filter((c) => c !== region.top);
    let fixing = region.fixing - named.filter((a) => a.status === 'perbaikan').length;
    for (let i = 0; i < rest; i += 1) {
      const category =
        region.top && i < Math.ceil(rest * 0.4) ? region.top : others[i % others.length];
      list.push({
        region: region.id,
        category,
        status: fixing > 0 ? 'perbaikan' : 'terverifikasi',
        alumni: null,
      });
      fixing -= 1;
    }
  });
  return list;
}

/* ———————————————————————— Laporan ———————————————————————— */

export const REPORT_TYPES = [
  {
    id: 'ringkasan',
    label: 'Ringkasan Program',
    title: 'Laporan Ringkasan Program',
    description: 'KPI, tren, dan capaian target',
    icon: 'chart',
  },
  {
    id: 'alumni',
    label: 'Data Alumni',
    title: 'Data Alumni',
    description: 'Profil, status, kelengkapan',
    icon: 'graduation',
  },
  {
    id: 'layanan',
    label: 'Data Layanan',
    title: 'Data Layanan',
    description: 'Layanan per kategori dan harga',
    icon: 'briefcase',
  },
  {
    id: 'pesanan',
    label: 'Data Pesanan',
    title: 'Data Pesanan',
    description: 'Pesanan per status dan bulan',
    icon: 'clipboard',
  },
  {
    id: 'ulasan',
    label: 'Ulasan & Rating',
    title: 'Ulasan & Rating',
    description: 'Distribusi rating 1–5',
    icon: 'star',
  },
  {
    id: 'wilayah',
    label: 'Sebaran Wilayah',
    title: 'Sebaran Wilayah',
    description: 'Per kota/kabupaten',
    icon: 'map',
  },
];

/** Pilihan cepat periode laporan (tanggal hari ini: data per 28 Okt 2026). */
export const REPORT_PERIODS = [
  { value: 'bulan', label: 'Bulan ini', from: '2026-10-01', to: '2026-10-31' },
  { value: '3bulan', label: '3 bulan', from: '2026-08-01', to: '2026-10-31' },
  { value: 'tahun', label: 'Tahun ini', from: '2026-01-01', to: '2026-10-31' },
  { value: 'kustom', label: 'Kustom' },
];

/** Distribusi rating 1–5 (persen) seluruh ulasan program. */
export const RATING_DISTRIBUTION = { 5: 64, 4: 26, 3: 7, 2: 2, 1: 1 };

/** Pesanan per bulan Jan–Okt 2026 (seluruh platform). */
export const MONTHLY_ORDERS = [38, 52, 58, 66, 74, 92, 104, 108, 120, 192];

export const SAMPLE_REPORTS = [
  {
    id: 'r-5',
    type: 'ringkasan',
    from: '2026-01-01',
    to: '2026-09-30',
    format: 'pdf',
    by: 'Andi Pratama',
    at: '2026-10-01T09:12:00+07:00',
  },
  {
    id: 'r-4',
    type: 'pesanan',
    from: '2026-09-01',
    to: '2026-09-30',
    format: 'csv',
    by: 'Rina Kartika',
    at: '2026-10-01T08:40:00+07:00',
  },
  {
    id: 'r-3',
    type: 'wilayah',
    from: '2026-01-01',
    to: '2026-09-30',
    format: 'pdf',
    by: 'Andi Pratama',
    at: '2026-09-30T16:05:00+07:00',
  },
  {
    id: 'r-2',
    type: 'ulasan',
    from: '2026-07-01',
    to: '2026-09-30',
    format: 'pdf',
    by: 'Rina Kartika',
    at: '2026-09-29T14:22:00+07:00',
  },
  {
    id: 'r-1',
    type: 'alumni',
    from: '2026-01-01',
    to: '2026-08-31',
    format: 'csv',
    by: 'Andi Pratama',
    at: '2026-09-02T10:03:00+07:00',
  },
];

/* ———————————————————————— Verifikasi · Perlu Perbaikan ———————————————————————— */

/** Bagian profil yang bisa diminta untuk diperbaiki. */
export const REVISION_SECTIONS = [
  'Lokasi',
  'Harga',
  'Deskripsi',
  'Jadwal',
  'Dokumen alumni',
  'Portofolio',
];

const revisionItem = (data) => ({
  workDays: [1, 2, 3, 4, 5, 6],
  hours: '08.00 – 16.00 WIB',
  decision: null,
  status: 'perbaikan',
  alumni: { file: 'Bukti alumni PPSGHD.pdf', detail: 'Angkatan 2022 · 380 KB' },
  ...data,
});

const allChecks = (...missing) =>
  Object.fromEntries(
    ['portfolio', 'data', 'alumni', 'service', 'location', 'schedule'].map((key) => [
      key,
      !missing.includes(key),
    ]),
  );

/**
 * Pendaftaran yang dikembalikan untuk diperbaiki (tab "Perlu Perbaikan Data").
 * `revision.resubmitted` = alumni sudah mengirim ulang datanya.
 */
export const SAMPLE_REVISIONS = [
  revisionItem({
    id: 'v-agus',
    name: 'Agus Setiawan',
    initials: 'AS',
    color: '#1d4ed8',
    category: 'desain',
    city: 'Kab. Bogor',
    registeredAt: '2026-10-14T09:00:00+07:00',
    email: 'agus.setiawan@email.com',
    phone: '+62 811-9988-7766',
    services: [{ name: 'Desain Logo UMKM', price: 'Rp150.000 / pesanan' }],
    address: 'Cibinong, Kab. Bogor, Jawa Barat',
    description: 'Desain logo, poster, dan materi promosi untuk UMKM.',
    checklist: allChecks('location'),
    revision: {
      sections: ['Lokasi'],
      requestedAt: '2026-10-21T10:00:00+07:00',
      by: 'Rina Kartika',
      note: 'Titik lokasi belum ditentukan di peta.',
      resubmitted: false,
    },
  }),
  revisionItem({
    id: 'v-hana',
    name: 'Hana Safitri',
    initials: 'HS',
    color: '#374151',
    category: 'kuliner',
    city: 'Kota Cirebon',
    registeredAt: '2026-10-15T10:00:00+07:00',
    email: 'hana.safitri@email.com',
    phone: '+62 856-1010-2020',
    services: [{ name: 'Katering Nasi Kotak', price: 'Rp22.000 / kotak' }],
    address: 'Jl. Siliwangi No. 20, Kejaksan, Kota Cirebon, Jawa Barat',
    description: 'Katering nasi kotak untuk acara kantor dan pengajian.',
    checklist: allChecks(),
    revision: {
      sections: ['Lokasi', 'Harga'],
      requestedAt: '2026-10-23T09:00:00+07:00',
      by: 'Andi Pratama',
      note: 'Titik lokasi dan harga per kotak perlu dilengkapi.',
      resubmitted: true,
    },
  }),
  revisionItem({
    id: 'v-dodi',
    name: 'Dodi Firmansyah',
    initials: 'DF',
    color: '#9a3412',
    category: 'servis-elektronik',
    city: 'Kab. Subang',
    registeredAt: '2026-10-18T09:00:00+07:00',
    email: 'dodi.firmansyah@email.com',
    phone: '+62 812-6060-7070',
    services: [{ name: 'Servis Elektronik Rumah', price: 'Rp50.000 / unit' }],
    address: 'Subang, Kab. Subang, Jawa Barat',
    description: 'Servis elektronik rumah tangga dan instalasi antena.',
    checklist: allChecks('location'),
    revision: {
      sections: ['Lokasi'],
      requestedAt: '2026-10-24T11:00:00+07:00',
      by: 'Rina Kartika',
      note: 'Titik lokasi belum ditentukan di peta.',
      resubmitted: false,
    },
  }),
  revisionItem({
    id: 'v-rani',
    name: 'Rani Septiani',
    initials: 'RS',
    color: '#be185d',
    category: 'jahit',
    city: 'Kota Bogor',
    registeredAt: '2026-10-19T09:00:00+07:00',
    email: 'rani.septiani@email.com',
    phone: '+62 857-8080-9090',
    services: [{ name: 'Permak Kebaya', price: 'Rp40.000 / potong' }],
    address: 'Jl. Pajajaran No. 3, Bogor Tengah, Kota Bogor, Jawa Barat',
    description: 'Permak kebaya dan jahit busana pesta.',
    checklist: allChecks(),
    revision: {
      sections: ['Deskripsi', 'Jadwal'],
      requestedAt: '2026-10-25T13:00:00+07:00',
      by: 'Andi Pratama',
      note: 'Deskripsi terlalu singkat dan jadwal belum diisi.',
      resubmitted: true,
    },
  }),
  revisionItem({
    id: 'v-irfan',
    name: 'Irfan Maulana',
    initials: 'IM',
    color: '#0e7490',
    category: 'kebersihan',
    city: 'Kab. Bekasi',
    registeredAt: '2026-10-20T09:00:00+07:00',
    email: 'irfan.maulana@email.com',
    phone: '+62 813-1414-1515',
    services: [{ name: 'Kebersihan Rumah', price: 'Rp45.000 / jam' }],
    address: 'Cikarang Utara, Kab. Bekasi, Jawa Barat',
    description: 'Bersih rumah dan kos dengan peralatan lengkap.',
    alumni: null,
    checklist: allChecks('alumni'),
    revision: {
      sections: ['Dokumen alumni'],
      requestedAt: '2026-10-26T10:00:00+07:00',
      by: 'Rina Kartika',
      note: 'Bukti alumni PPSGHD belum diunggah.',
      resubmitted: false,
    },
  }),
  revisionItem({
    id: 'v-sri',
    name: 'Sri Wahyuni',
    initials: 'SW',
    color: '#6d28d9',
    category: 'terapi',
    city: 'Kota Depok',
    registeredAt: '2026-10-21T09:00:00+07:00',
    email: 'sri.wahyuni@email.com',
    phone: '+62 821-1616-1717',
    services: [{ name: 'Pijat Relaksasi', price: 'Rp75.000 / jam' }],
    address: 'Jl. Nusantara No. 8, Pancoran Mas, Kota Depok, Jawa Barat',
    description: 'Pijat relaksasi dan refleksi, bisa datang ke rumah.',
    checklist: allChecks(),
    revision: {
      sections: ['Harga'],
      requestedAt: '2026-10-27T09:00:00+07:00',
      by: 'Andi Pratama',
      note: 'Harga per sesi belum dicantumkan.',
      resubmitted: true,
    },
  }),
];
