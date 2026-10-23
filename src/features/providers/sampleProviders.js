import kebersihanCardIcon from '@/assets/icons/cat-kebersihan-card.svg';
import jahitIcon from '@/assets/icons/cat-jahit.svg';
import elektronikIcon from '@/assets/icons/cat-elektronik.svg';
import kulinerIcon from '@/assets/icons/cat-kuliner.svg';
import desainIcon from '@/assets/icons/cat-desain.svg';
import terapiIcon from '@/assets/icons/cat-terapi.svg';

/**
 * Data contoh penyedia (sesuai desain Beranda & Cari Layanan).
 * Ganti dengan respons API penyedia setelah endpoint tersedia.
 * `availability`: 'kerja' = Senin–Jumat, 'akhir-pekan' = Sabtu–Minggu.
 */
export const SAMPLE_PROVIDERS = [
  {
    id: 'rizki-maulana',
    name: 'Rizki Maulana',
    initials: 'RM',
    avatarColor: '#0b3c6e',
    rating: 4.9,
    reviewCount: 128,
    categorySlug: 'kebersihan',
    category: 'Layanan Kebersihan',
    categoryIcon: kebersihanCardIcon,
    city: 'Bandung',
    description: 'Bersih-bersih rumah, kos, dan kantor kecil dengan alat sendiri.',
    priceFrom: 50000,
    priceUnit: 'jam',
    availability: ['kerja', 'akhir-pekan'],
  },
  {
    id: 'lina-kurnia',
    name: 'Lina Kurnia',
    initials: 'LK',
    avatarColor: '#6d28d9',
    rating: 5,
    reviewCount: 52,
    categorySlug: 'kuliner',
    category: 'Kue & Kuliner Rumahan',
    categoryIcon: kulinerIcon,
    city: 'Tasikmalaya',
    description: 'Kue basah, nasi kotak, dan snack box untuk acara keluarga.',
    priceFrom: 25000,
    priceUnit: 'pesanan',
    availability: ['kerja', 'akhir-pekan'],
  },
  {
    id: 'deni-setiawan',
    name: 'Deni Setiawan',
    initials: 'DS',
    avatarColor: '#9a3412',
    rating: 4.9,
    reviewCount: 74,
    categorySlug: 'servis-elektronik',
    category: 'Servis Elektronik',
    categoryIcon: elektronikIcon,
    city: 'Bekasi',
    description: 'Perbaikan TV, kipas angin, rice cooker, dan alat rumah tangga.',
    priceFrom: 75000,
    priceUnit: 'servis',
    availability: ['kerja'],
  },
  {
    id: 'siti-nurjanah',
    name: 'Siti Nurjanah',
    initials: 'SN',
    avatarColor: '#0e7c7c',
    rating: 4.8,
    reviewCount: 96,
    categorySlug: 'jahit',
    category: 'Jahit & Permak',
    categoryIcon: jahitIcon,
    city: 'Depok',
    description: 'Permak celana, vermak baju, dan jahit seragam sesuai ukuran.',
    priceFrom: 30000,
    priceUnit: 'item',
    availability: ['kerja'],
  },
  {
    id: 'agus-setiawan',
    name: 'Agus Setiawan',
    initials: 'AS',
    avatarColor: '#1d4ed8',
    rating: 4.7,
    reviewCount: 41,
    categorySlug: 'desain',
    category: 'Desain Grafis',
    categoryIcon: desainIcon,
    city: 'Bandung',
    description: 'Desain logo, poster, dan konten media sosial untuk UMKM.',
    priceFrom: 100000,
    availability: ['kerja', 'akhir-pekan'],
  },
  {
    id: 'fahri-hidayat',
    name: 'Fahri Hidayat',
    initials: 'FH',
    avatarColor: '#be185d',
    rating: 4.9,
    reviewCount: 63,
    categorySlug: 'terapi',
    category: 'Terapi Pijat',
    categoryIcon: terapiIcon,
    city: 'Bogor',
    description: 'Pijat relaksasi dan refleksi, bisa datang ke rumah Anda.',
    priceFrom: 60000,
    priceUnit: 'jam',
    availability: ['akhir-pekan'],
  },
];

/** Jumlah penyedia per kota untuk peta sebaran (contoh dari desain). */
export const SAMPLE_CITY_STATS = [
  { city: 'Bandung', count: 32 },
  { city: 'Bekasi', count: 18 },
  { city: 'Bogor', count: 14 },
  { city: 'Tasikmalaya', count: 12 },
  { city: 'Cirebon', count: 11 },
  { city: 'Karawang', count: 9 },
  { city: 'Sukabumi', count: 8 },
];
