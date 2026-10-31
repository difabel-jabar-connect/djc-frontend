import { useCallback } from 'react';
import { useSearchParams } from 'react-router';

/**
 * Paginasi daftar lewat query `?halaman=` (tombol back browser tetap jalan).
 * `resetPage()` dipanggil saat filter berubah agar kembali ke halaman 1.
 */
export function usePagedList(items, pageSize) {
  const [params, setParams] = useSearchParams();
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, Number(params.get('halaman')) || 1), totalPages);
  const start = (page - 1) * pageSize;

  const buildHref = (target) => {
    const next = new URLSearchParams(params);
    if (target > 1) next.set('halaman', String(target));
    else next.delete('halaman');
    const query = next.toString();
    return query ? `?${query}` : '?';
  };

  const resetPage = useCallback(() => {
    setParams(
      (prev) => {
        if (!prev.has('halaman')) return prev;
        const next = new URLSearchParams(prev);
        next.delete('halaman');
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  return {
    page,
    totalPages,
    total,
    from: total ? start + 1 : 0,
    to: Math.min(start + pageSize, total),
    pageItems: items.slice(start, start + pageSize),
    buildHref,
    resetPage,
  };
}

/** Nilai awal filter dari query (mis. `?cari=Joko` dari tautan Audit Log). */
export function useInitialParam(name, fallback = '') {
  const [params] = useSearchParams();
  return params.get(name) ?? fallback;
}
