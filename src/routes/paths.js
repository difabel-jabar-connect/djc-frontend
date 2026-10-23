/**
 * Daftar path terpusat. Pakai konstanta ini di <Link>/navigate,
 * jangan tulis string path berulang di komponen.
 */
export const PATHS = {
  home: '/',
  services: '/services',
  map: '/map',
  providerDetail: '/provider/:id',
  login: '/login',
  register: '/register',
  customerBookings: '/bookings',
  providerDashboard: '/dashboard/provider',
  adminDashboard: '/admin',
};

export const buildProviderPath = (id) => `/provider/${encodeURIComponent(id)}`;
