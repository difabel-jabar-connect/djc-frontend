import { DAY_OPTIONS, getCategory, PRICE_OPTIONS, RATING_OPTIONS } from './catalog';

export const PAGE_SIZE = 6;

/** Kunci query string halaman Cari Layanan (dipakai juga oleh Beranda). */
export const FILTER_KEYS = ['kategori', 'lokasi', 'rating', 'harga', 'hari'];

/** Baca kriteria pencarian dari URLSearchParams. */
export function readCriteria(searchParams) {
  const page = Number.parseInt(searchParams.get('hal') ?? '1', 10);
  return {
    q: (searchParams.get('q') ?? '').trim(),
    kategori: searchParams.get('kategori') ?? '',
    lokasi: searchParams.get('lokasi') ?? '',
    rating: searchParams.get('rating') ?? '',
    harga: searchParams.get('harga') ?? '',
    hari: searchParams.get('hari') ?? '',
    urut: searchParams.get('urut') ?? 'relevan',
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

const normalize = (value) => value.toLocaleLowerCase('id-ID');

function matchesQuery(provider, q) {
  if (!q) return true;
  const haystack = normalize(
    [
      provider.name,
      provider.category,
      getCategory(provider.categorySlug)?.label ?? '',
      provider.city,
      provider.description,
    ].join(' '),
  );
  return normalize(q)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}

/** Saring + urutkan penyedia sesuai kriteria (sementara di sisi klien). */
export function filterProviders(providers, criteria) {
  const minRating = RATING_OPTIONS.find((o) => o.value === criteria.rating)?.min;
  const priceTest = PRICE_OPTIONS.find((o) => o.value === criteria.harga)?.test;

  const result = providers.filter(
    (provider) =>
      matchesQuery(provider, criteria.q) &&
      (!criteria.kategori || provider.categorySlug === criteria.kategori) &&
      (!criteria.lokasi || provider.city === criteria.lokasi) &&
      (!minRating || provider.rating >= minRating) &&
      (!priceTest || priceTest(provider.priceFrom)) &&
      (!criteria.hari || provider.availability.includes(criteria.hari)),
  );

  if (criteria.urut === 'rating') {
    return [...result].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  }
  if (criteria.urut === 'harga') {
    return [...result].sort((a, b) => a.priceFrom - b.priceFrom);
  }
  return result;
}

/** Potong hasil per halaman. Halaman di luar jangkauan dijepit ke halaman terakhir. */
export function paginate(items, page, pageSize = PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: current,
    totalPages,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + pageSize, items.length),
    total: items.length,
  };
}

const labelOf = (options, value) => options.find((o) => o.value === value)?.label;

/** Ringkasan filter aktif dalam bahasa manusia, mis. "Kebersihan, Bandung". */
export function describeActiveFilters(criteria) {
  return [
    criteria.q && `“${criteria.q}”`,
    getCategory(criteria.kategori)?.label,
    criteria.lokasi,
    labelOf(RATING_OPTIONS, criteria.rating) &&
      `Rating ${labelOf(RATING_OPTIONS, criteria.rating)}`,
    labelOf(PRICE_OPTIONS, criteria.harga),
    labelOf(DAY_OPTIONS, criteria.hari),
  ].filter(Boolean);
}
