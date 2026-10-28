import RootLayout from '@/layouts/RootLayout';
import StandaloneLayout from '@/layouts/StandaloneLayout';
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
import CheckEmailPage from '@/pages/auth/CheckEmailPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import ResetPasswordSuccessPage from '@/pages/auth/ResetPasswordSuccessPage';
import RegisterSuccessPage from '@/pages/auth/RegisterSuccessPage';
import CustomerBookingsPage from '@/pages/customer/CustomerBookingsPage';
import BookingDetailPage from '@/pages/customer/BookingDetailPage';
import ProviderDashboardPage from '@/pages/provider/ProviderDashboardPage';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import VerificationPage from '@/pages/admin/VerificationPage';
import UsersPage from '@/pages/admin/UsersPage';
import CategoriesPage from '@/pages/admin/CategoriesPage';
import ReviewsPage from '@/pages/admin/ReviewsPage';
import OrdersPage from '@/pages/admin/OrdersPage';
import AuditLogPage from '@/pages/admin/AuditLogPage';
import SettingsLayout from '@/pages/admin/settings/SettingsLayout';
import ProfileSettings from '@/pages/admin/settings/ProfileSettings';
import SecuritySettings from '@/pages/admin/settings/SecuritySettings';
import NotificationSettings from '@/pages/admin/settings/NotificationSettings';
import PlatformInfoSettings from '@/pages/admin/settings/PlatformInfoSettings';
import SystemRulesSettings from '@/pages/admin/settings/SystemRulesSettings';
import RequireAuth from './RequireAuth';
import { PATHS } from './paths';

/**
 * Definisi rute (dipisah dari router agar mudah diuji dengan MemoryRouter).
 * Halaman pelanggan dilindungi <RequireAuth>. Proteksi dashboard penyedia/pengelola
 * menyusul setelah Auth API backend (SP1-03) tersedia.
 */
export const routes = [
  // Halaman layar penuh (tanpa header & footer situs): auth & dashboard.
  {
    element: <StandaloneLayout />,
    children: [
      { path: PATHS.login, element: <LoginPage /> },
      { path: PATHS.register, element: <RegisterPage /> },
      { path: PATHS.registerSuccess, element: <RegisterSuccessPage /> },
      { path: PATHS.forgotPassword, element: <ForgotPasswordPage /> },
      { path: PATHS.forgotPasswordSent, element: <CheckEmailPage /> },
      { path: PATHS.resetPassword, element: <ResetPasswordPage /> },
      { path: PATHS.resetPasswordSuccess, element: <ResetPasswordSuccessPage /> },
      { path: PATHS.providerDashboard, element: <ProviderDashboardPage /> },
      {
        path: PATHS.adminDashboard,
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: PATHS.adminVerification, element: <VerificationPage /> },
          { path: PATHS.adminUsers, element: <UsersPage /> },
          { path: PATHS.adminCategories, element: <CategoriesPage /> },
          { path: PATHS.adminReviews, element: <ReviewsPage /> },
          { path: PATHS.adminOrders, element: <OrdersPage /> },
          { path: PATHS.adminAudit, element: <AuditLogPage /> },
          {
            path: PATHS.adminSettings,
            element: <SettingsLayout />,
            children: [
              { index: true, element: <ProfileSettings /> },
              { path: PATHS.adminSettingsSecurity, element: <SecuritySettings /> },
              { path: PATHS.adminSettingsNotifications, element: <NotificationSettings /> },
              { path: PATHS.adminSettingsPlatform, element: <PlatformInfoSettings /> },
              { path: PATHS.adminSettingsRules, element: <SystemRulesSettings /> },
            ],
          },
        ],
      },
    ],
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
      {
        element: <RequireAuth allow="customer" />,
        children: [
          { path: PATHS.booking, element: <BookingPage /> },
          { path: PATHS.customerBookings, element: <CustomerBookingsPage /> },
          { path: PATHS.bookingDetail, element: <BookingDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
