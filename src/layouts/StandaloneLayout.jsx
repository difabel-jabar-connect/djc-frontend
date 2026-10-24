import { Outlet } from 'react-router';
import SkipLink from '@/components/common/SkipLink';

/**
 * Layout layar penuh tanpa header & footer situs: halaman autentikasi (Masuk)
 * dan dashboard. Halaman menyediakan <main id="main-content"> sendiri.
 */
export default function StandaloneLayout() {
  return (
    <div className="auth-shell">
      <SkipLink targetId="main-content" />
      <Outlet />
    </div>
  );
}
