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
  register: '/register',
  customerBookings: '/bookings',
  providerDashboard: '/dashboard/provider',
  adminDashboard: '/admin',
};

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
