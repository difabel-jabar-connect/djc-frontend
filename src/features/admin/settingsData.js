/**
 * Data contoh Pengaturan Admin (desain Pengaturan: Profil, Keamanan, Notifikasi,
 * Informasi Platform, Aturan Sistem). Ganti dengan API pengaturan setelah tersedia.
 */
import { RESPONSE_HOURS } from '@/features/booking/bookingDraft';
import { INVITE_HOURS } from './accountForm';

export const AVATAR_COLOR_OPTIONS = [
  { value: '#0b3c6e', label: 'Navy' },
  { value: '#0c7272', label: 'Teal' },
  { value: '#6d28d9', label: 'Ungu' },
  { value: '#be185d', label: 'Merah muda' },
  { value: '#9a3412', label: 'Cokelat' },
  { value: '#1d4ed8', label: 'Biru' },
];

/** Sesi masuk akun admin. `current` = perangkat yang sedang dipakai. */
export const SAMPLE_SESSIONS = [
  {
    id: 's-chrome',
    device: 'Chrome · Windows 11',
    type: 'laptop',
    city: 'Kota Bandung',
    lastActiveAt: null,
    current: true,
  },
  {
    id: 's-iphone',
    device: 'Safari · iPhone',
    type: 'phone',
    city: 'Kota Bandung',
    lastActiveAt: '2026-10-27T21:14:00+07:00',
  },
  {
    id: 's-edge',
    device: 'Edge · Windows 10',
    type: 'laptop',
    city: 'Kota Cimahi',
    lastActiveAt: '2026-10-24T09:02:00+07:00',
  },
];

/** Preferensi notifikasi. `app: null` = hanya tersedia lewat email. */
export const SAMPLE_NOTIFICATION_PREFS = [
  {
    id: 'verifikasi',
    label: 'Penyedia baru menunggu verifikasi',
    description: 'Saat ada pendaftaran mitra baru.',
    app: true,
    email: true,
  },
  {
    id: 'ulasan',
    label: 'Ulasan dilaporkan',
    description: 'Saat penyedia melaporkan ulasan.',
    app: true,
    email: true,
  },
  {
    id: 'pesanan',
    label: 'Pesanan Menunggu lebih dari 20 jam',
    description: 'Sebelum dibatalkan otomatis oleh Sistem.',
    app: true,
    email: false,
  },
  {
    id: 'akun',
    label: 'Akun baru dibuat oleh pengelola lain',
    description: 'Termasuk akun Pengelola dan Pengguna.',
    app: true,
    email: false,
  },
  {
    id: 'ringkasan',
    label: 'Ringkasan harian aktivitas platform',
    description: 'Dikirim setiap hari pukul 07.00 WIB.',
    app: null,
    email: true,
  },
];

export const TAGLINE_MAX = 80;
export const PLATFORM_DESCRIPTION_MAX = 300;
export const ADDRESS_MAX = 200;

export const SAMPLE_PLATFORM_INFO = {
  name: 'Difabel Jabar Connect',
  tagline: 'Talenta Difabel, untuk Jawa Barat yang Lebih Inklusif',
  description:
    'Layanan on-demand berbasis peta yang menghubungkan masyarakat dengan penyedia layanan alumni difabel UPTD PPSGHD Jawa Barat.',
  email: 'bantuan@difabeljabar.id',
  phone: '81122334455',
  hours: 'Senin–Jumat, 08.00–15.00 WIB',
  address: 'Jl. Pagarsih No. 8, Cibadak, Astanaanyar, Kota Bandung, Jawa Barat 40241',
  partners: [
    {
      id: 'p-alumni',
      name: 'Alumni PPSGHD',
      description: 'Penyedia layanan, lulusan pelatihan keterampilan UPTD PPSGHD.',
      icon: 'users',
    },
    {
      id: 'p-uptd',
      name: 'UPTD PPSGHD Jawa Barat',
      description: 'Pembina alumni dan pengelola platform.',
      icon: 'building',
    },
  ],
};

/** Label field Informasi Platform untuk ringkasan perubahan. */
export const PLATFORM_FIELDS = {
  name: { label: 'Nama Platform', section: 'Identitas Platform' },
  tagline: { label: 'Tagline', section: 'Identitas Platform' },
  description: { label: 'Deskripsi singkat', section: 'Identitas Platform' },
  email: { label: 'Email Bantuan', section: 'Kontak Bantuan' },
  phone: { label: 'Nomor WhatsApp Bantuan', section: 'Kontak Bantuan' },
  hours: { label: 'Jam Layanan', section: 'Kontak Bantuan' },
  address: { label: 'Alamat Kantor', section: 'Kontak Bantuan' },
  partners: { label: 'Mitra Kolaborasi', section: 'Mitra Kolaborasi' },
};

/** Aturan sistem (hanya baca) — mengikuti SRS. */
export const SYSTEM_RULES = [
  {
    icon: 'clock',
    label: 'Batas respons pesanan',
    value: `${RESPONSE_HOURS} jam`,
    note: 'Pesanan Menunggu dibatalkan otomatis oleh Sistem.',
  },
  {
    icon: 'phone',
    label: 'Kontak & alamat penyedia',
    value: 'Diterima / Berjalan',
    note: 'Terbuka hanya saat pesanan berstatus Diterima atau Berjalan.',
  },
  {
    icon: 'review',
    label: 'Ulasan',
    value: '1 kali per pesanan',
    note: 'Hanya bisa ditulis setelah status Selesai.',
  },
  {
    icon: 'wallet',
    label: 'Pembayaran',
    value: 'Langsung ke penyedia',
    note: 'Dilakukan di luar platform.',
  },
  {
    icon: 'mail',
    label: 'Masa berlaku undangan akun',
    value: `${INVITE_HOURS} jam`,
    note: 'Setelah itu undangan perlu dikirim ulang.',
  },
  {
    icon: 'map',
    label: 'Peta',
    value: 'OpenStreetMap',
    note: 'Titik tengah default: Kota Bandung.',
  },
];
