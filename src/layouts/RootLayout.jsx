import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import SkipLink from '@/components/common/SkipLink';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function RootLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const previousPathname = useRef(pathname);

  // Pada SPA, pindah halaman tidak memindahkan fokus. Pindahkan fokus ke <main>
  // agar pengguna keyboard & screen reader tahu konten sudah berganti.
  // Dibandingkan dengan path sebelumnya (bukan flag render pertama) agar effect
  // ganda StrictMode tidak memfokuskan <main> saat halaman baru dibuka.
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    mainRef.current?.focus();
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="app-shell">
      <SkipLink targetId="main-content" />
      <Header />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
