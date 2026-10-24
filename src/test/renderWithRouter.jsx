import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/routes/routes';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerProvider } from '@/context/CustomerContext';

/**
 * Render aplikasi lengkap pada path tertentu tanpa browser history sungguhan.
 * `user` = sesi awal (default: belum masuk); `bookings` = data pesanan awal.
 */
export function renderAt(path = '/', { user = null, bookings } = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    router,
    ...render(
      <AuthProvider initialUser={user}>
        <CustomerProvider {...(bookings ? { initialBookings: bookings } : {})}>
          <RouterProvider router={router} />
        </CustomerProvider>
      </AuthProvider>,
    ),
  };
}
