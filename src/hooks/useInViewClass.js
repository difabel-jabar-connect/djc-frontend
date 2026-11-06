import { useEffect, useRef } from 'react';

/**
 * Tambahkan kelas `is-in` sekali saat elemen masuk layar (≈ 88% dari atas viewport).
 * Animasinya ditulis di CSS di dalam `prefers-reduced-motion: no-preference` + `.js`, jadi isi
 * tetap terlihat tanpa JavaScript dan untuk pengguna reduced-motion.
 */
export function useInViewClass() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver !== 'function') {
      el.classList.add('is-in');
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}
