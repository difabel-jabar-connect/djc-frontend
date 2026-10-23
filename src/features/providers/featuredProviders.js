import kebersihanIcon from '@/assets/icons/cat-kebersihan-card.svg';
import jahitIcon from '@/assets/icons/cat-jahit.svg';
import elektronikIcon from '@/assets/icons/cat-elektronik.svg';
import kulinerIcon from '@/assets/icons/cat-kuliner.svg';

/**
 * Data contoh penyedia unggulan (sesuai desain Figma Beranda).
 * Ganti dengan respons API penyedia setelah endpoint tersedia.
 */
export const FEATURED_PROVIDERS = [
  {
    id: 'rizki-maulana',
    name: 'Rizki Maulana',
    initials: 'RM',
    avatarColor: '#0b3c6e',
    rating: 4.9,
    reviewCount: 128,
    category: 'Layanan Kebersihan',
    categoryIcon: kebersihanIcon,
    city: 'Bandung',
    priceFrom: 50000,
    priceUnit: 'jam',
  },
  {
    id: 'siti-nurjanah',
    name: 'Siti Nurjanah',
    initials: 'SN',
    avatarColor: '#0e7c7c',
    rating: 4.8,
    reviewCount: 96,
    category: 'Jahit & Permak',
    categoryIcon: jahitIcon,
    city: 'Depok',
    priceFrom: 30000,
    priceUnit: 'item',
  },
  {
    id: 'deni-setiawan',
    name: 'Deni Setiawan',
    initials: 'DS',
    avatarColor: '#9a3412',
    rating: 4.9,
    reviewCount: 74,
    category: 'Servis Elektronik',
    categoryIcon: elektronikIcon,
    city: 'Bekasi',
    priceFrom: 75000,
    priceUnit: 'servis',
  },
  {
    id: 'lina-kurnia',
    name: 'Lina Kurnia',
    initials: 'LK',
    avatarColor: '#6d28d9',
    rating: 5,
    reviewCount: 52,
    category: 'Kue & Kuliner Rumahan',
    categoryIcon: kulinerIcon,
    city: 'Tasikmalaya',
    priceFrom: 25000,
    priceUnit: 'pesanan',
  },
];
