import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/**
 * Pada SPA, pindah halaman tidak memindahkan fokus. Pindahkan fokus ke elemen
 * `ref` (biasanya <main>) agar pengguna keyboard & screen reader tahu konten berganti.
 * Dibandingkan dengan path sebelumnya (bukan flag render pertama) agar effect
 * ganda StrictMode tidak memfokuskan elemen saat halaman baru dibuka.
 */
export function useRouteFocus(ref) {
  const { pathname, hash } = useLocation();
  const previousPathname = useRef(pathname);
  const navigationType = useNavigationType();

  // Layout baru terpasang karena navigasi di dalam aplikasi (mis. Masuk → Beranda):
  // mulai dari atas, jangan mewarisi posisi gulir halaman sebelumnya. Muat ulang/Back
  // (POP) dibiarkan agar browser memulihkan posisi gulirnya sendiri.
  useEffect(() => {
    if (navigationType !== 'POP' && !hash) window.scrollTo(0, 0);
    // Hanya saat layout pertama kali terpasang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    ref.current?.focus();
    window.scrollTo(0, 0);
  }, [pathname, ref]);
}
