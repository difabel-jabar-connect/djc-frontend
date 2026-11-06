import { useCallback, useEffect, useState } from 'react';
import { groupServicesByProvider } from '@/features/providers/providerAdapters';
import { searchServices } from './servicesApi';

/** Batas per permintaan di backend (MAX_LIMIT) dan jumlah halaman yang diambil sekaligus. */
const API_LIMIT = 50;
const MAX_PAGES = 4;
const CACHE_TTL_MS = 60_000;

/** Cache singkat per kriteria: Beranda memakai data yang sama di beberapa bagian. */
const cache = new Map();

/** Kosongkan cache (dipakai test agar setiap test mulai dari data server). */
export function clearSearchCache() {
  cache.clear();
}

/**
 * Ambil seluruh layanan yang cocok (maks. MAX_PAGES × 50), lalu jadikan kartu per penyedia.
 * Daftar dipaginasi di klien agar filter "cari di area peta" dan pin peta tetap memakai
 * seluruh hasil, bukan hanya satu halaman.
 */
export async function fetchProviders(apiCriteria, { signal } = {}) {
  const services = [];
  let page = 1;
  let totalPages = 1;
  do {
    const { items, meta } = await searchServices(
      { ...apiCriteria, page, limit: API_LIMIT },
      { signal },
    );
    services.push(...items);
    totalPages = meta.total_pages;
    page += 1;
  } while (page <= Math.min(totalPages, MAX_PAGES));
  return groupServicesByProvider(services);
}

function cachedFetch(key, apiCriteria) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.promise;
  const promise = fetchProviders(apiCriteria);
  cache.set(key, { at: Date.now(), promise });
  // Permintaan gagal tidak disimpan supaya tombol "Coba lagi" benar-benar meminta ulang.
  promise.catch(() => cache.delete(key));
  return promise;
}

/** Kriteria tetap untuk Beranda (pin hero, peta sebaran, unggulan) agar memakai satu cache. */
const PUBLIC_CRITERIA = { sort: 'rating_desc' };

/**
 * Semua penyedia publik, diurutkan rating tertinggi. Dipakai bersama oleh bagian Beranda;
 * berkat cache hanya satu rangkaian permintaan ke backend.
 */
export function usePublicProviders() {
  return useProviderSearch(PUBLIC_CRITERIA);
}

/**
 * Hasil pencarian penyedia dari backend.
 * status: 'loading' | 'success' | 'error'. `retry()` meminta ulang setelah gagal.
 */
export function useProviderSearch(apiCriteria) {
  const key = JSON.stringify(apiCriteria);
  const [state, setState] = useState({ key: null, status: 'loading', providers: [], error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState((current) =>
      current.key === key && current.status === 'success'
        ? current
        : { key, status: 'loading', providers: current.providers, error: null },
    );
    cachedFetch(key, JSON.parse(key)).then(
      (providers) => active && setState({ key, status: 'success', providers, error: null }),
      (error) => active && setState({ key, status: 'error', providers: [], error }),
    );
    return () => {
      active = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => {
    cache.delete(key);
    setAttempt((n) => n + 1);
  }, [key]);

  // Selama kriteria baru dimuat, tampilkan status memuat (bukan hasil kriteria lama).
  const fresh = state.key === key;
  return {
    status: fresh ? state.status : 'loading',
    providers: fresh ? state.providers : [],
    error: fresh ? state.error : null,
    retry,
  };
}
