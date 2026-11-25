import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * Jejak halaman yang dibuka di dalam aplikasi (path + query), terbaru di akhir. Dipakai
 * halaman Pesan Layanan untuk tombol Kembali: kembali ke halaman asal pengguna (Cari
 * Layanan, profil penyedia, Beranda, …), bukan selalu ke profil penyedia.
 */
const trail = [];
const TRAIL_MAX = 20;

/** Pasang sekali di layout yang membungkus semua halaman. */
export function useNavigationTrail() {
  const { pathname, search } = useLocation();
  const path = `${pathname}${search}`;
  useEffect(() => {
    if (trail.at(-1) === path) return;
    trail.push(path);
    if (trail.length > TRAIL_MAX) trail.shift();
  }, [path]);
}

/** Halaman terakhir yang dibuka sebelum halaman ini dan tidak ditolak `skip(path)`. */
export function lastVisitedPath(skip = () => false) {
  for (let index = trail.length - 1; index >= 0; index -= 1) {
    if (!skip(trail[index])) return trail[index];
  }
  return null;
}
