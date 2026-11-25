import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/context/useAuth';
import { homePathFor } from '@/features/auth/session';
import { PATHS } from './paths';

/**
 * Lindungi rute untuk peran tertentu. Belum masuk → ke halaman Masuk (lalu kembali
 * ke sini lewat `?next=`); peran lain → ke halaman awal perannya. Kalau sesi berakhir saat
 * halaman ini terbuka (tombol Keluar), arahkan ke Beranda tanpa `?next=`, supaya login
 * berikutnya tidak kembali ke halaman yang ditinggalkan.
 */
export default function RequireAuth({ allow }) {
  const { user } = useAuth();
  const location = useLocation();
  const [openedSignedIn] = useState(Boolean(user));

  if (!user) {
    if (openedSignedIn) return <Navigate to={PATHS.home} replace />;
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`${PATHS.login}?next=${next}`} replace />;
  }
  if (allow && user.role !== allow) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return <Outlet />;
}
