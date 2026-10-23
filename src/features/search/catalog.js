import kebersihanIcon from '@/assets/icons/cat-kebersihan.svg';
import elektronikIcon from '@/assets/icons/cat-elektronik.svg';
import desainIcon from '@/assets/icons/cat-desain.svg';
import jahitIcon from '@/assets/icons/cat-jahit.svg';
import kulinerIcon from '@/assets/icons/cat-kuliner.svg';
import terapiIcon from '@/assets/icons/cat-terapi.svg';

/**
 * Kategori & wilayah untuk filter pencarian.
 * Sementara statis sesuai desain; nanti diganti data dari API kategori/wilayah.
 */
export const POPULAR_CATEGORIES = [
  { slug: 'kebersihan', label: 'Kebersihan', icon: kebersihanIcon },
  { slug: 'servis-elektronik', label: 'Servis Elektronik', icon: elektronikIcon },
  { slug: 'desain', label: 'Desain', icon: desainIcon },
  { slug: 'jahit', label: 'Jahit', icon: jahitIcon },
  { slug: 'kuliner', label: 'Kuliner', icon: kulinerIcon },
  { slug: 'terapi', label: 'Terapi', icon: terapiIcon },
];

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
