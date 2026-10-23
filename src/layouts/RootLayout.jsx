import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';
import SkipLink from '@/components/common/SkipLink';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function RootLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  // Pada SPA, pindah halaman tidak memindahkan fokus. Pindahkan fokus ke <main>
  // agar pengguna keyboard & screen reader tahu konten sudah berganti.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
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
