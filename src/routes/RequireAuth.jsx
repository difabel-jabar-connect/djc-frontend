import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/context/useAuth';
import { homePathFor } from '@/features/auth/session';
import { PATHS } from './paths';

/**
 * Lindungi rute untuk peran tertentu. Belum masuk → ke halaman Masuk (lalu kembali
 * ke sini lewat `?next=`); peran lain → ke halaman awal perannya.
 */
export default function RequireAuth({ allow }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${PATHS.login}?next=${next}`} replace />;
  }
  if (allow && user.role !== allow) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return <Outlet />;
}
