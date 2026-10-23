import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

/**
 * Pada SPA, pindah halaman tidak memindahkan fokus. Pindahkan fokus ke elemen
 * `ref` (biasanya <main>) agar pengguna keyboard & screen reader tahu konten berganti.
 * Dibandingkan dengan path sebelumnya (bukan flag render pertama) agar effect
 * ganda StrictMode tidak memfokuskan elemen saat halaman baru dibuka.
 */
export function useRouteFocus(ref) {
  const { pathname } = useLocation();
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    ref.current?.focus();
    window.scrollTo(0, 0);
  }, [pathname, ref]);
}
