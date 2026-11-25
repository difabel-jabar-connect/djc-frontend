import { useEffect, useState } from 'react';
import { CATEGORIES, getCategory } from './catalog';
import { getCategories } from './servicesApi';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cached = null;

/** Kosongkan cache kategori (untuk unit test). */
export function clearCategoriesCache() {
  cached = null;
}

/**
 * Mengambil daftar kategori aktif dari `GET /api/v1/categories` (FE-03),
 * dipadukan dengan ikon lokal dari `catalog.js`. Jika API belum siap atau offline,
 * tetap menampilkan `CATEGORIES` bawaan agar filter tidak kosong.
 */
export function useCategories() {
  const [categories, setCategories] = useState(() =>
    cached && Date.now() - cached.at < CACHE_TTL_MS ? cached.items : CATEGORIES,
  );

  useEffect(() => {
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) return undefined;
    let ignore = false;

    getCategories()
      .then((rows) => {
        if (ignore || !Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map((row) => {
          const local = getCategory(row.slug);
          return {
            slug: row.slug,
            label: local?.label ?? row.name,
            shortLabel: local?.shortLabel ?? row.name,
            icon: local?.icon ?? null,
            keywords: local?.keywords ?? [row.name.toLowerCase()],
          };
        });
        cached = { at: Date.now(), items: mapped };
        setCategories(mapped);
      })
      .catch(() => {
        // Tetap memakai CATEGORIES bawaan saat backend tidak terjangkau.
      });

    return () => {
      ignore = true;
    };
  }, []);

  return categories;
}
