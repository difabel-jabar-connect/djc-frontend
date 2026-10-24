import { useRef } from 'react';
import { Outlet } from 'react-router';
import SkipLink from '@/components/common/SkipLink';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useRouteFocus } from '@/hooks/useRouteFocus';

export default function RootLayout() {
  const mainRef = useRef(null);
  useRouteFocus(mainRef);

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
