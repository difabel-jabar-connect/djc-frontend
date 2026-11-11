import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import { getProviderProfile as getSampleProfile } from '@/features/providers/providerProfiles';
import { getCategory } from '@/features/search/catalog';

/**
 * Backend tiruan untuk test: menjawab GET /services, GET /providers/:id, dan POST /bookings
 * dengan bentuk respons djc-backend, memakai data contoh lokal (SAMPLE_PROVIDERS) sebagai
 * isi database. Aturan filter mengikuti backend (src/repositories/serviceRepository.js).
 * Endpoint lain dijawab 404 (test yang butuh endpoint lain memasang fetch sendiri).
 */

const BASE = 'http://api.test/api/v1';

/** Jadwal contoh: hari kerja penyedia, 08.00–12.00 dan 13.00–17.00 (jeda istirahat). */
const availabilityOf = (workDays) =>
  workDays.flatMap((day) => [
    { day_of_week: day, start_time: '08:00', end_time: '12:00' },
    { day_of_week: day, start_time: '13:00', end_time: '17:00' },
  ]);

const providerOf = (sample) => ({
  id: sample.id,
  display_name: sample.name,
  photo_url: null,
  photo_alt: null,
  city: sample.city,
  district: sample.district ?? null,
  public_lat: sample.lat,
  public_lng: sample.lng,
  rating_avg: sample.rating,
  rating_count: sample.reviewCount,
});

/** Satu layanan per paket profil contoh. */
function servicesOf(sample) {
  const profile = getSampleProfile(sample.id);
  const categoryName = getCategory(sample.categorySlug)?.label ?? sample.category;
  return profile.packages.map((pkg, index) => {
    const hourly = pkg.priceUnit === 'jam';
    return {
      id: `${sample.id}--${pkg.id}`,
      title: pkg.title,
      description: index === 0 ? sample.description : pkg.description,
      pricing_type: hourly ? 'hourly' : 'starting_from',
      price_amount: pkg.priceFrom,
      min_hours: hourly ? 1 : null,
      duration_estimate_min: null,
      service_mode: 'at_customer',
      created_at: '2026-10-01T00:00:00.000Z',
      category: { id: `cat-${sample.categorySlug}`, name: categoryName, slug: sample.categorySlug },
      provider: providerOf(sample),
      workDays: profile.workDays,
    };
  });
}

const SERVICES = SAMPLE_PROVIDERS.flatMap(servicesOf);

/** `workDays` hanya bantu filter hari di tiruan ini, tidak ada di respons backend. */
function withoutWorkDays(service) {
  const copy = { ...service };
  delete copy.workDays;
  return copy;
}

const lower = (text) => String(text ?? '').toLocaleLowerCase('id-ID');

const SORTS = {
  newest: () => 0,
  price_asc: (a, b) => a.price_amount - b.price_amount,
  price_desc: (a, b) => b.price_amount - a.price_amount,
  rating_desc: (a, b) =>
    b.provider.rating_avg - a.provider.rating_avg ||
    b.provider.rating_count - a.provider.rating_count,
};

function searchServices(params) {
  const words = lower(params.get('q')).split(/\s+/).filter(Boolean);
  const category = params.get('category');
  const city = params.get('city');
  const minPrice = params.has('min_price') ? Number(params.get('min_price')) : null;
  const maxPrice = params.has('max_price') ? Number(params.get('max_price')) : null;
  const minRating = params.has('min_rating') ? Number(params.get('min_rating')) : null;
  const day = params.has('day_of_week') ? Number(params.get('day_of_week')) : null;
  const sort = SORTS[params.get('sort') ?? 'newest'] ?? SORTS.newest;
  const page = Number(params.get('page') ?? 1);
  const limit = Number(params.get('limit') ?? 12);

  const matches = SERVICES.filter((service) => {
    const haystack = [
      service.title,
      service.description,
      service.provider.display_name,
      service.category.name,
    ].map(lower);
    return (
      words.every((word) => haystack.some((field) => field.includes(word))) &&
      (!category || service.category.slug === category) &&
      (!city || service.provider.city === city) &&
      (minPrice === null || service.price_amount >= minPrice) &&
      (maxPrice === null || service.price_amount <= maxPrice) &&
      (minRating === null || service.provider.rating_avg >= minRating) &&
      (day === null || service.workDays.includes(day))
    );
  }).sort(sort);

  const items = matches.slice((page - 1) * limit, page * limit).map(withoutWorkDays);
  return {
    data: items,
    meta: {
      page,
      limit,
      total_items: matches.length,
      total_pages: Math.ceil(matches.length / limit),
    },
  };
}

function providerProfile(id) {
  const sample = SAMPLE_PROVIDERS.find((provider) => provider.id === id);
  if (!sample) return null;
  const services = servicesOf(sample);
  return {
    ...providerOf(sample),
    bio: sample.description,
    communication_prefs: ['chat'],
    service_radius_km: 5,
    skills: [],
    // eslint-disable-next-line no-unused-vars
    services: services.map(({ provider, description, created_at, workDays, ...rest }) => rest),
    availability: availabilityOf(getSampleProfile(id).workDays),
    portfolio: [],
  };
}

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const notFound = (message) => json({ error: { code: 'NOT_FOUND', message } }, 404);

/** Status tiruan yang bisa diatur test. */
export const fakeApi = {
  /** Semua permintaan yang diterima: { method, path, body }. */
  calls: [],
  /** true → setiap permintaan gagal seperti server mati (ERR_NET_FAIL di klien). */
  offline: false,
  /** Respons kustom untuk POST /bookings (mis. error validasi), atau null. */
  bookingResponse: null,
  reset() {
    this.calls = [];
    this.offline = false;
    this.bookingResponse = null;
    bookingSeq = 0;
  },
};

let bookingSeq = 0;

export async function fakeFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method ?? 'GET').toUpperCase();
  const path = url.href.startsWith(BASE) ? url.pathname.replace('/api/v1', '') : url.pathname;
  const body = init.body ? JSON.parse(init.body) : undefined;
  fakeApi.calls.push({ method, path, search: url.search, body });

  if (fakeApi.offline) throw new TypeError('Failed to fetch');

  if (method === 'GET' && path === '/health') return json({ data: { status: 'ok' } });
  if (method === 'GET' && path === '/services') return json(searchServices(url.searchParams));

  const provider = /^\/providers\/([^/]+)$/.exec(path);
  if (method === 'GET' && provider) {
    const profile = providerProfile(decodeURIComponent(provider[1]));
    return profile ? json({ data: profile }) : notFound('Penyedia jasa tidak ditemukan.');
  }

  if (method === 'POST' && path === '/bookings') {
    if (fakeApi.bookingResponse) return json(...fakeApi.bookingResponse);
    bookingSeq += 1;
    const service = SERVICES.find((item) => item.id === body.service_id);
    const quantity = body.quantity ?? 1;
    return json(
      {
        data: {
          id: `booking-${bookingSeq}`,
          code: `DJC-TEST${String(bookingSeq).padStart(4, '0')}`,
          status: 'requested',
          service: { id: service?.id, title: service?.title },
          scheduled_date: body.scheduled_date,
          start_time: body.start_time,
          service_mode: body.service_mode,
          unit_price_snapshot: service?.price_amount ?? 0,
          quantity,
          estimated_total: (service?.price_amount ?? 0) * quantity,
        },
      },
      201,
    );
  }

  return notFound('Endpoint tidak tersedia di backend tiruan.');
}
