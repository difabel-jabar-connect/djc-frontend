import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes, routerFutureFlags, providerFutureFlags } from '@/routes/routes';

/** Render aplikasi lengkap pada path tertentu tanpa browser history sungguhan. */
export function renderAt(path = '/') {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    future: routerFutureFlags,
  });
  return { router, ...render(<RouterProvider router={router} future={providerFutureFlags} />) };
}
