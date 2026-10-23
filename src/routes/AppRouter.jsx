import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes, routerFutureFlags, providerFutureFlags } from './routes';

const router = createBrowserRouter(routes, { future: routerFutureFlags });

export default function AppRouter() {
  return <RouterProvider router={router} future={providerFutureFlags} />;
}
