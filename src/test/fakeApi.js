import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import { getProviderProfile as getSampleProfile } from '@/features/providers/providerProfiles';
import { getCategory } from '@/features/search/catalog';

/**
 * Backend tiruan untuk test: menjawab GET /services, GET /providers/:id, POST /bookings, dan
 * endpoint Akun Saya (/me, /me/addresses untuk akun demo pelanggan)
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

/** Alamat tersimpan akun demo pelanggan (GET /me/addresses), bentuk respons backend. */
export const demoAddresses = () => [
  {
    id: 'rumah',
    label: 'Rumah',
    address: 'Jl. Cigadung Raya No. 12, Cibeunying Kaler, Bandung',
    detail: null,
    area: 'Cibeunying Kaler',
    lat: -6.874,
    lng: 107.634,
    is_primary: true,
  },
  {
    id: 'kantor',
    label: 'Kantor',
    address: 'Jl. Asia Afrika No. 88, Sumur Bandung, Bandung',
    detail: null,
    area: 'Sumur Bandung',
    lat: -6.9214,
    lng: 107.6097,
    is_primary: false,
  },
];

/** Akun yang sedang "masuk" di backend tiruan (endpoint /me). */
const demoAccount = () => ({
  user: {
    id: 'u-budi',
    role: 'customer',
    name: 'Budi Santoso',
    email: 'budi.santoso@contoh.id',
    phone: '+6281234567890',
    avatar_url: null,
    has_password: true,
    email_verified: true,
    status: 'active',
  },
  password: 'Demo12345',
  addresses: demoAddresses(),
});

const validationError = (field, message) =>
  json(
    {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Data yang dikirim belum valid.',
        details: [{ field, message }],
      },
    },
    400,
  );

let addressSeq = 0;

/** Endpoint Akun Saya (/me). Mengembalikan null bila path bukan milik /me. */
function accountRoute(method, path, body) {
  const account = fakeApi.account;
  const sorted = () =>
    [...account.addresses].sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  const userResponse = () => json({ data: { user: { ...account.user } } });

  if (method === 'PATCH' && path === '/me') {
    if (body.name !== undefined) account.user.name = body.name.trim();
    if (body.phone !== undefined) account.user.phone = body.phone;
    return userResponse();
  }
  if (method === 'PUT' && (path === '/me/password' || path === '/me/email')) {
    if (!account.user.has_password) {
      return json(
        { error: { code: 'PASSWORD_NOT_SET', message: 'Akun ini belum punya kata sandi.' } },
        409,
      );
    }
    if (body.current_password !== account.password) {
      return validationError('current_password', 'Kata sandi saat ini salah.');
    }
    if (path === '/me/password') {
      account.password = body.new_password;
      return json({ data: { password_changed: true } });
    }
    account.user.email = body.email.trim().toLowerCase();
    account.user.email_verified = false;
    return userResponse();
  }
  if (path === '/me/photo') {
    account.user.avatar_url = method === 'PUT' ? 'https://res.cloudinary.test/foto.webp' : null;
    return userResponse();
  }
  if (method === 'GET' && path === '/me/addresses') return json({ data: sorted() });
  if (method === 'POST' && path === '/me/addresses') {
    if (account.addresses.length >= 10) {
      return json({ error: { code: 'CONFLICT', message: 'Maksimal 10 alamat tersimpan.' } }, 409);
    }
    addressSeq += 1;
    const primary = Boolean(body.is_primary) || account.addresses.length === 0;
    if (primary) account.addresses.forEach((a) => (a.is_primary = false));
    const row = {
      id: `alamat-${addressSeq}`,
      label: body.label,
      address: body.address,
      detail: body.detail || null,
      area: body.area || null,
      lat: body.lat,
      lng: body.lng,
      is_primary: primary,
    };
    account.addresses.unshift(row);
    return json({ data: row }, 201);
  }
  const one = /^\/me\/addresses\/([^/]+)$/.exec(path);
  if (one) {
    const row = account.addresses.find((a) => a.id === decodeURIComponent(one[1]));
    if (!row) return notFound('Alamat tidak ditemukan.');
    if (method === 'DELETE') {
      account.addresses = account.addresses.filter((a) => a !== row);
      if (row.is_primary && account.addresses[0]) account.addresses[0].is_primary = true;
      return json({ data: { deleted: true } });
    }
    if (method === 'PATCH') {
      if (body.is_primary === true) account.addresses.forEach((a) => (a.is_primary = false));
      Object.assign(row, {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.detail !== undefined && { detail: body.detail || null }),
        ...(body.area !== undefined && { area: body.area || null }),
        ...(body.lat !== undefined && { lat: body.lat, lng: body.lng }),
        ...(body.is_primary === true && { is_primary: true }),
      });
      return json({ data: row });
    }
  }
  return null;
}

/** Status tiruan yang bisa diatur test. */
export const fakeApi = {
  /** Semua permintaan yang diterima: { method, path, body }. */
  calls: [],
  /** true → setiap permintaan gagal seperti server mati (ERR_NET_FAIL di klien). */
  offline: false,
  /** Respons kustom untuk POST /bookings (mis. error validasi), atau null. */
  bookingResponse: null,
  /** Akun di balik endpoint /me; test bisa mengubah isinya (mis. `addresses = []`). */
  account: demoAccount(),
  reset() {
    this.calls = [];
    this.offline = false;
    this.bookingResponse = null;
    this.account = demoAccount();
    bookingSeq = 0;
    addressSeq = 0;
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

  if (path === '/me' || path.startsWith('/me/')) {
    const response = accountRoute(method, path, body ?? {});
    if (response) return response;
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
