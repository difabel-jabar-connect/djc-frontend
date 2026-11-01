/**
 * Daftar path terpusat. Pakai konstanta ini di <Link>/navigate,
 * jangan tulis string path berulang di komponen.
 */
export const PATHS = {
  home: '/',
  services: '/services',
  map: '/map',
  about: '/tentang',
  providerDetail: '/provider/:id',
  booking: '/pesan/:id',
  login: '/login',
  forgotPassword: '/lupa-kata-sandi',
  forgotPasswordSent: '/lupa-kata-sandi/cek-email',
  resetPassword: '/reset-kata-sandi',
  resetPasswordSuccess: '/reset-kata-sandi/berhasil',
  register: '/register',
  registerSuccess: '/register/berhasil',
  customerBookings: '/bookings',
  bookingDetail: '/bookings/:code',
  bookingChat: '/bookings/:code/chat',
  providerDashboard: '/dashboard/provider',
  providerChat: '/dashboard/provider/chat',
  providerChatThread: '/dashboard/provider/chat/:code',
  adminDashboard: '/admin',
  adminVerification: '/admin/verifikasi',
  adminUsers: '/admin/user',
  adminCategories: '/admin/kategori',
  adminReviews: '/admin/ulasan',
  adminOrders: '/admin/pesanan',
  adminAudit: '/admin/audit',
  adminSettings: '/admin/pengaturan',
  adminSettingsSecurity: '/admin/pengaturan/keamanan',
  adminSettingsNotifications: '/admin/pengaturan/notifikasi',
  adminSettingsPlatform: '/admin/pengaturan/informasi',
  adminSettingsRules: '/admin/pengaturan/aturan',
  pengelola: '/pengelola',
  pengelolaAlumni: '/pengelola/alumni',
  pengelolaAlumniDetail: '/pengelola/alumni/:id',
  pengelolaServices: '/pengelola/layanan',
  pengelolaCategories: '/pengelola/layanan/kategori',
  pengelolaOrders: '/pengelola/pesanan',
  pengelolaRegions: '/pengelola/wilayah',
  pengelolaVerification: '/pengelola/verifikasi',
  pengelolaReports: '/pengelola/laporan',
  pengelolaSettings: '/pengelola/pengaturan',
  pengelolaSettingsSecurity: '/pengelola/pengaturan/keamanan',
  pengelolaSettingsNotifications: '/pengelola/pengaturan/notifikasi',
  pengelolaSettingsPlatform: '/pengelola/pengaturan/informasi',
  pengelolaSettingsRules: '/pengelola/pengaturan/aturan',
};

export const buildAlumniPath = (id) => `/pengelola/alumni/${encodeURIComponent(id)}`;

/** URL halaman admin beserta query (mis. `{ cari: 'Joko' }`); nilai kosong diabaikan. */
export function buildAdminPath(path, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/** Bangun URL halaman pencarian beserta query (q, lokasi, kategori). Nilai kosong diabaikan. */
export function buildServicesPath(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `${PATHS.services}?${query}` : PATHS.services;
}

/** URL Masuk/Daftar yang membawa tujuan setelah berhasil (`?next=`), mis. lanjut pemesanan. */
export function buildAuthPath(path, next) {
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

/** Tujuan `next` mengarah ke alur Pesan Layanan? (untuk pesan konteks di halaman Masuk/Daftar) */
export const isBookingNext = (next) => typeof next === 'string' && next.startsWith('/pesan/');

/** Chat pelanggan dengan penyedia untuk satu pesanan. */
export const buildBookingChatPath = (code) => `/bookings/${encodeURIComponent(code)}/chat`;

/** Chat sisi penyedia (kotak masuk), opsional langsung ke percakapan `code`. */
export const buildProviderChatPath = (code) =>
  code ? `/dashboard/provider/chat/${encodeURIComponent(code)}` : '/dashboard/provider/chat';

export const buildProviderPath = (id) => `/provider/${encodeURIComponent(id)}`;

/** URL halaman pemesanan; `params` opsional (paket, tanggal) diteruskan sebagai query. */
export function buildBookingPath(id, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  const path = `/pesan/${encodeURIComponent(id)}`;
  return query ? `${path}?${query}` : path;
}

/** URL detail pesanan pelanggan; `params` opsional (mis. `{ ulasan: 4 }`) jadi query. */
export function buildBookingDetailPath(code, params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  const path = `/bookings/${encodeURIComponent(code)}`;
  return query ? `${path}?${query}` : path;
}
