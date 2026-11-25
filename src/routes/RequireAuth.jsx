import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/context/useAuth';
import { saveAuthRedirect } from '@/features/auth/redirect';
import { homePathFor } from '@/features/auth/session';
import { PATHS } from './paths';

/**
 * Lindungi rute untuk peran tertentu. Belum masuk → ke halaman Masuk sambil membawa tujuan
 * lewat React Router `location.state` + sessionStorage (bukan `?next=` di URL agar path
 * internal/UUID tidak terekspos). Kalau sesi berakhir saat halaman ini terbuka (tombol Keluar),
 * arahkan ke Beranda supaya login berikutnya tidak kembali ke halaman yang ditinggalkan.
 */
export default function RequireAuth({ allow }) {
  const { user } = useAuth();
  const location = useLocation();
  const [openedSignedIn] = useState(Boolean(user));

  if (!user) {
    if (openedSignedIn) return <Navigate to={PATHS.home} replace />;
    const from = `${location.pathname}${location.search}${location.hash}`;
    saveAuthRedirect(from);
    return <Navigate to={PATHS.login} state={{ from }} replace />;
  }
  if (allow && user.role !== allow) {
    return <Navigate to={homePathFor(user.role)} replace />;
  }
  return <Outlet />;
}
