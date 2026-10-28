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
  providerDashboard: '/dashboard/provider',
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
};

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
