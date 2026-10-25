import { SAMPLE_PROVIDERS } from './sampleProviders';

/**
 * Detail profil penyedia (desain HTML Profil Penyedia & Pemesanan).
 * Hanya Siti & Rizki yang punya data lengkap di desain; penyedia lain memakai
 * nilai bawaan yang diturunkan dari data dasar. Ganti dengan API profil penyedia.
 *
 * workDays: hari buka (0 = Minggu … 6 = Sabtu).
 */
const PROFILE_DETAILS = {
  'siti-nurjanah': {
    categoryLabel: 'Jahit & Permak Pakaian',
    banner: 'jahit',
    online: true,
    responseTime: 'Respons dalam 1 jam',
    alumniNote:
      'Lulusan program pelatihan menjahit UPTD PPSGHD dan aktif mengikuti pendampingan usaha alumni.',
    about: [
      'Siti adalah alumni program pelatihan menjahit UPTD PPSGHD Jawa Barat yang kini membuka usaha jahit dari rumahnya di Depok. Ia menerima permak pakaian harian, jahit pakaian custom sesuai ukuran, hingga busana muslim untuk acara keluarga.',
      'Setiap pesanan dikerjakan dengan teliti dan dikonfirmasi ukurannya terlebih dahulu. Pengambilan dan pengantaran pakaian bisa diatur untuk wilayah Depok, Jakarta Selatan, dan Tangerang.',
    ],
    quote:
      'Setiap jahitan adalah cara saya menunjukkan bahwa keterbatasan bukan penghalang untuk berkarya.',
    serviceAreas: ['Depok', 'Jakarta Selatan', 'Tangerang'],
    experience: '3+ tahun',
    stats: { completed: '50+', onTime: '98%' },
    workDays: [1, 2, 3, 4, 5, 6],
    packages: [
      {
        id: 'permak',
        title: 'Permak Pakaian',
        priceFrom: 30000,
        priceUnit: 'item',
        description: 'Potong, kecilkan, atau perbaiki celana, kemeja, dan rok.',
        art: 'permak',
      },
      {
        id: 'custom',
        title: 'Jahit Pakaian Custom',
        priceFrom: 75000,
        priceUnit: 'item',
        description: 'Kemeja, rok, atau seragam dijahit sesuai ukuran badan Anda.',
        art: 'custom',
      },
      {
        id: 'busana-muslim',
        title: 'Jahit Busana Muslim',
        priceFrom: 100000,
        priceUnit: 'item',
        description: 'Gamis, tunik, dan setelan muslim untuk harian maupun acara.',
        art: 'muslim',
      },
    ],
    reviews: [
      {
        id: 'r1',
        name: 'Rina A.',
        initials: 'RA',
        color: '#6d28d9',
        when: '2 minggu lalu',
        rating: 5,
        text: 'Permak celana kerja jadi pas sekali. Rapi, cepat, dan Bu Siti ramah saat konfirmasi ukuran.',
      },
      {
        id: 'r2',
        name: 'Dewi P.',
        initials: 'DP',
        color: '#0c7272',
        when: '1 bulan lalu',
        rating: 5,
        text: 'Gamis untuk lebaran dijahit sesuai model yang saya minta. Jahitannya halus dan kuat.',
      },
      {
        id: 'r3',
        name: 'Hendra S.',
        initials: 'HS',
        color: '#9a3412',
        when: '1 bulan lalu',
        rating: 4,
        text: 'Seragam kantor tiga potong selesai tepat waktu. Komunikasi lancar lewat chat.',
      },
    ],
    areaMap: {
      labels: [
        { name: 'Jakarta', x: 171, y: 38, box: [137, 46, 68] },
        { name: 'Tangerang', x: 56, y: 112, box: [16, 120, 80] },
        { name: 'Bekasi', x: 292, y: 104, box: [258, 112, 68] },
        { name: 'Bogor', x: 171, y: 236, box: [141, 206, 60] },
      ],
      description: 'pusat di Depok, menjangkau Jakarta, Tangerang, Bekasi, dan Bogor',
    },
  },
  'rizki-maulana': {
    online: true,
    responseTime: 'Respons dalam 1 jam',
    joinedYear: 2023,
    highlights: ['Penyedia Terverifikasi', 'Respons Cepat', 'Rating Tinggi'],
    workDays: [0, 1, 2, 3, 4, 5, 6],
    packages: [
      {
        id: 'kebersihan-rumah',
        title: 'Layanan Kebersihan Rumah',
        priceFrom: 50000,
        priceUnit: 'jam',
        description: 'Menyapu, mengepel, merapikan kamar, dapur, dan kamar mandi.',
        estimate: 'Estimasi 2–4 jam',
      },
    ],
  },
};

export const PAYMENT_METHODS = {
  transfer: { label: 'Transfer Bank', description: 'BCA, BNI, Mandiri, dll.' },
  ewallet: { label: 'E-Wallet', description: 'OVO, GoPay, DANA, ShopeePay' },
  cod: { label: 'Tunai (COD)', description: 'Bayar langsung ke penyedia' },
};

const DEFAULT_PAYMENTS = ['transfer', 'ewallet', 'cod'];

const workDaysFromAvailability = (availability = []) => [
  ...(availability.includes('akhir-pekan') ? [0] : []),
  ...(availability.includes('kerja') ? [1, 2, 3, 4, 5] : []),
  ...(availability.includes('akhir-pekan') ? [6] : []),
];

/** Profil lengkap penyedia, atau null bila id tidak dikenal. */
export function getProviderProfile(id) {
  const base = SAMPLE_PROVIDERS.find((provider) => provider.id === id);
  if (!base) return null;
  const detail = PROFILE_DETAILS[id] ?? {};

  return {
    ...base,
    categoryLabel: base.category,
    verified: true,
    online: false,
    responseTime: null,
    alumniNote: null,
    about: [base.description],
    quote: null,
    serviceAreas: [base.city],
    experience: null,
    stats: {},
    hours: '08.00 – 17.00 WIB',
    paymentMethods: DEFAULT_PAYMENTS,
    highlights: ['Penyedia Terverifikasi'],
    joinedYear: null,
    reviews: [],
    areaMap: null,
    banner: null,
    ...detail,
    workDays: detail.workDays ?? workDaysFromAvailability(base.availability),
    packages: detail.packages ?? [
      {
        id: 'utama',
        title: base.category,
        priceFrom: base.priceFrom,
        priceUnit: base.priceUnit,
        description: base.description,
      },
    ],
  };
}
