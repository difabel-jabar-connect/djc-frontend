import { cityKey } from '@/features/providers/providerAdapters';
import { DAY_OPTIONS, getCategory, PRICE_OPTIONS, RATING_OPTIONS, SORT_TO_API } from './catalog';

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

/**
 * Kriteria UI → parameter GET /services. Kata kunci, kategori, rating, harga, hari, dan
 * urutan disaring backend. Lokasi disaring di klien (lihat filterByCity) karena backend
 * menyimpan "Kota Bandung"/"Kabupaten Bandung" sedangkan filter UI memakai "Bandung".
 * Nilai yang tidak dikenal (mis. tautan lama ?hari=kerja) diabaikan.
 */
export function toApiCriteria(criteria) {
  const price = PRICE_OPTIONS.find((option) => option.value === criteria.harga);
  const rating = RATING_OPTIONS.find((option) => option.value === criteria.rating);
  const day = DAY_OPTIONS.find((option) => option.value === criteria.hari);
  return {
    q: criteria.q || undefined,
    category: getCategory(criteria.kategori) ? criteria.kategori : undefined,
    min_rating: rating?.min,
    min_price: price?.min,
    max_price: price?.max,
    day_of_week: day?.value,
    sort: SORT_TO_API[criteria.urut] ?? SORT_TO_API.relevan,
  };
}

/** Saring kartu penyedia per kota ("Bandung" cocok dengan "Kota Bandung" & "Kab. Bandung"). */
export function filterByCity(providers, lokasi) {
  if (!lokasi) return providers;
  const key = cityKey(lokasi);
  return providers.filter((provider) => cityKey(provider.cityRaw || provider.city) === key);
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
    labelOf(DAY_OPTIONS, criteria.hari) && `Tersedia ${labelOf(DAY_OPTIONS, criteria.hari)}`,
  ].filter(Boolean);
}
