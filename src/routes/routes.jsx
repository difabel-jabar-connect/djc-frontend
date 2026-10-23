import RootLayout from '@/layouts/RootLayout';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import ServicesPage from '@/pages/services/ServicesPage';
import MapPage from '@/pages/map/MapPage';
import ProviderDetailPage from '@/pages/providers/ProviderDetailPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import CustomerBookingsPage from '@/pages/customer/CustomerBookingsPage';
import ProviderDashboardPage from '@/pages/provider/ProviderDashboardPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import { PATHS } from './paths';

// Opt-in perilaku React Router v7 sejak awal agar upgrade nanti mulus.
export const routerFutureFlags = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
};
export const providerFutureFlags = { v7_startTransition: true };

/**
 * Definisi rute (dipisah dari router agar mudah diuji dengan MemoryRouter).
 * Proteksi rute berbasis peran (customer/provider/admin) akan ditambahkan
 * pada SP1-04 setelah Auth API backend (SP1-03) tersedia.
 */
export const routes = [
  {
    path: PATHS.home,
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: PATHS.services, element: <ServicesPage /> },
      { path: PATHS.map, element: <MapPage /> },
      { path: PATHS.providerDetail, element: <ProviderDetailPage /> },
      { path: PATHS.login, element: <LoginPage /> },
      { path: PATHS.register, element: <RegisterPage /> },
      { path: PATHS.customerBookings, element: <CustomerBookingsPage /> },
      { path: PATHS.providerDashboard, element: <ProviderDashboardPage /> },
      { path: PATHS.adminDashboard, element: <AdminDashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
