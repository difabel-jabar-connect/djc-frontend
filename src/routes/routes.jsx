import RootLayout from '@/layouts/RootLayout';
import AuthLayout from '@/layouts/AuthLayout';
import HomePage from '@/pages/home/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import ServicesPage from '@/pages/services/ServicesPage';
import MapPage from '@/pages/map/MapPage';
import AboutPage from '@/pages/about/AboutPage';
import ProviderDetailPage from '@/pages/providers/ProviderDetailPage';
import BookingPage from '@/pages/booking/BookingPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import CustomerBookingsPage from '@/pages/customer/CustomerBookingsPage';
import ProviderDashboardPage from '@/pages/provider/ProviderDashboardPage';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import { PATHS } from './paths';

/**
 * Definisi rute (dipisah dari router agar mudah diuji dengan MemoryRouter).
 * Proteksi rute berbasis peran (customer/provider/admin) akan ditambahkan
 * pada SP1-04 setelah Auth API backend (SP1-03) tersedia.
 */
export const routes = [
  // Halaman auth layar penuh (tanpa header & footer).
  {
    element: <AuthLayout />,
    children: [{ path: PATHS.login, element: <LoginPage /> }],
  },
  {
    path: PATHS.home,
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: PATHS.services, element: <ServicesPage /> },
      { path: PATHS.map, element: <MapPage /> },
      { path: PATHS.about, element: <AboutPage /> },
      { path: PATHS.providerDetail, element: <ProviderDetailPage /> },
      { path: PATHS.booking, element: <BookingPage /> },
      { path: PATHS.register, element: <RegisterPage /> },
      { path: PATHS.forgotPassword, element: <ForgotPasswordPage /> },
      { path: PATHS.customerBookings, element: <CustomerBookingsPage /> },
      { path: PATHS.providerDashboard, element: <ProviderDashboardPage /> },
      { path: PATHS.adminDashboard, element: <AdminDashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
