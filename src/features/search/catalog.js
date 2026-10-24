import kebersihanIcon from '@/assets/icons/cat-kebersihan.svg';
import elektronikIcon from '@/assets/icons/cat-elektronik.svg';
import desainIcon from '@/assets/icons/cat-desain.svg';
import jahitIcon from '@/assets/icons/cat-jahit.svg';
import kulinerIcon from '@/assets/icons/cat-kuliner.svg';
import terapiIcon from '@/assets/icons/cat-terapi.svg';

/**
 * Kategori & wilayah untuk filter pencarian.
 * Sementara statis sesuai desain; nanti diganti data dari API kategori/wilayah.
 * `shortLabel` dipakai di chip Beranda yang ruangnya lebih sempit.
 */
export const CATEGORIES = [
  { slug: 'kebersihan', label: 'Kebersihan', icon: kebersihanIcon },
  { slug: 'servis-elektronik', label: 'Servis Elektronik', icon: elektronikIcon },
  { slug: 'jahit', label: 'Jahit', icon: jahitIcon },
  { slug: 'kuliner', label: 'Kuliner', icon: kulinerIcon },
  { slug: 'desain', label: 'Desain Grafis', shortLabel: 'Desain', icon: desainIcon },
  { slug: 'terapi', label: 'Terapi Pijat', shortLabel: 'Terapi', icon: terapiIcon },
];

export const getCategory = (slug) => CATEGORIES.find((category) => category.slug === slug);

/** Urutan chip "Kategori populer" di Beranda. */
export const POPULAR_CATEGORIES = [
  'kebersihan',
  'servis-elektronik',
  'desain',
  'jahit',
  'kuliner',
  'terapi',
].map((slug) => {
  const category = getCategory(slug);
  return { ...category, label: category.shortLabel ?? category.label };
});

export const CITIES = [
  'Bandung',
  'Bekasi',
  'Bogor',
  'Cirebon',
  'Depok',
  'Karawang',
  'Sukabumi',
  'Tasikmalaya',
];

export const RATING_OPTIONS = [
  { value: '4', label: '4 ke atas', min: 4 },
  { value: '4.5', label: '4,5 ke atas', min: 4.5 },
];

export const PRICE_OPTIONS = [
  { value: 'lt50', label: 'Di bawah Rp50.000', test: (price) => price < 50000 },
  {
    value: '50-100',
    label: 'Rp50.000–Rp100.000',
    test: (price) => price >= 50000 && price <= 100000,
  },
  { value: 'gt100', label: 'Di atas Rp100.000', test: (price) => price > 100000 },
];

export const DAY_OPTIONS = [
  { value: 'kerja', label: 'Hari kerja' },
  { value: 'akhir-pekan', label: 'Akhir pekan' },
];

export const SORT_OPTIONS = [
  { value: 'relevan', label: 'Paling Relevan' },
  { value: 'rating', label: 'Rating Tertinggi' },
  { value: 'harga', label: 'Harga Terendah' },
  // Butuh lokasi pengguna (fitur peta); sementara memakai urutan relevansi.
  { value: 'terdekat', label: 'Terdekat' },
];
