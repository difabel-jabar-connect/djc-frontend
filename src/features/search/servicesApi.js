import { api } from '@/lib/api/client';

/**
 * Mengambil daftar kategori aktif dari backend (C1).
 * Mengembalikan array kategori: [{ id, name, slug, description, icon_url, sort_order }, ...].
 */
export async function getCategories() {
  const res = await api.get('/categories');
  return res?.data ?? [];
}

/**
 * Mencari layanan jasa dengan berbagai filter (L1, GET /services).
 * Nama parameter mengikuti backend (djc-backend src/routes/services.js).
 *
 * @param {Object} criteria - { q, category, city, min_price, max_price, min_rating,
 *   day_of_week, sort, page, limit }
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ items: Array, meta: { page, limit, total_items, total_pages } }>}
 */
export async function searchServices(criteria = {}, { signal } = {}) {
  const params = new URLSearchParams();
  const set = (key, value) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  };

  set('q', criteria.q?.trim());
  if (criteria.category !== 'semua') set('category', criteria.category);
  if (criteria.city !== 'semua') set('city', criteria.city);
  set('min_price', criteria.min_price);
  set('max_price', criteria.max_price);
  set('min_rating', criteria.min_rating);
  set('day_of_week', criteria.day_of_week);
  set('sort', criteria.sort);
  set('page', criteria.page);
  set('limit', criteria.limit);

  const query = params.toString();
  const res = await api.get(query ? `/services?${query}` : '/services', { signal });
  const meta = res?.meta ?? {};
  return {
    items: res?.data ?? [],
    meta: {
      page: meta.page ?? 1,
      limit: meta.limit ?? 12,
      total_items: meta.total_items ?? 0,
      total_pages: meta.total_pages ?? 0,
    },
  };
}

/**
 * Mengambil detail layanan berdasarkan UUID (L2), termasuk jadwal penyedia.
 * @param {string} id - UUID layanan
 */
export async function getServiceDetail(id, { signal } = {}) {
  const res = await api.get(`/services/${encodeURIComponent(id)}`, { signal });
  return res?.data;
}

/**
 * Mengambil profil publik penyedia berdasarkan UUID (P3): layanan, jadwal, portofolio.
 * Koordinat yang dikembalikan berupa koordinat kasar (fuzzed ~1.1 km).
 * @param {string} id - UUID provider
 */
export async function getProviderProfile(id, { signal } = {}) {
  const res = await api.get(`/providers/${encodeURIComponent(id)}`, { signal });
  return res?.data;
}
