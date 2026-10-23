import { Outlet } from 'react-router';
import SkipLink from '@/components/common/SkipLink';

/**
 * Layout layar penuh untuk halaman autentikasi (Masuk, Daftar, Lupa Kata Sandi):
 * tanpa header & footer. Halaman menyediakan <main id="main-content"> sendiri.
 */
export default function AuthLayout() {
  return (
    <div className="auth-shell">
      <SkipLink targetId="main-content" />
      <Outlet />
    </div>
  );
}
