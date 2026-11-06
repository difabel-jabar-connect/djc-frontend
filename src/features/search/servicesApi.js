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
 * Mencari layanan jasa dengan berbagai filter (L1).
 * @param {Object} criteria - { q, category, city, min_rating, day, sort, page, limit }
 * @returns {Promise<{ items: Array, meta: Object }>}
 */
export async function searchServices(criteria = {}) {
  const params = new URLSearchParams();

  if (criteria.q?.trim()) params.set('q', criteria.q.trim());
  if (criteria.category && criteria.category !== 'semua') params.set('category', criteria.category);
  if (criteria.city && criteria.city !== 'semua') params.set('city', criteria.city);
  if (criteria.min_rating) params.set('min_rating', criteria.min_rating);
  if (criteria.day !== undefined && criteria.day !== '') params.set('day', criteria.day);
  if (criteria.sort) params.set('sort', criteria.sort);
  if (criteria.page) params.set('page', criteria.page);
  if (criteria.limit) params.set('limit', criteria.limit);

  const query = params.toString();
  const path = query ? `/services?${query}` : '/services';
  const res = await api.get(path);

  return {
    items: res?.data ?? [],
    meta: res?.meta ?? { page: 1, per_page: 12, total: 0, total_pages: 0 },
  };
}

/**
 * Mengambil detail layanan berdasarkan UUID (L2).
 * @param {string} id - UUID layanan
 */
export async function getServiceDetail(id) {
  const res = await api.get(`/services/${id}`);
  return res?.data;
}

/**
 * Mengambil profil publik penyedia berdasarkan UUID (P3).
 * Koordinat yang dikembalikan berupa koordinat kasar (fuzzed ~1.1 km).
 * @param {string} id - UUID provider
 */
export async function getProviderProfile(id) {
  const res = await api.get(`/providers/${id}`);
  return res?.data;
}
