import { Outlet } from 'react-router';
import SkipLink from '@/components/common/SkipLink';
import { useNavigationTrail } from '@/hooks/useNavigationTrail';

/**
 * Layout layar penuh tanpa header & footer situs: halaman autentikasi (Masuk)
 * dan dashboard. Halaman menyediakan <main id="main-content"> sendiri.
 */
export default function StandaloneLayout() {
  useNavigationTrail();
  return (
    <div className="auth-shell">
      <SkipLink targetId="main-content" />
      <Outlet />
    </div>
  );
}
