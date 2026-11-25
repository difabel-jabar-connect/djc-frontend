import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import { getProviderProfile as getSampleProfile } from '@/features/providers/providerProfiles';
import { CATEGORIES, getCategory } from '@/features/search/catalog';

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

const demoProviderState = () => ({
  profile: {
    id: '44444444-4444-4444-8444-444444444444',
    display_name: 'Deni Setiawan',
    photo_url: null,
    photo_alt: null,
    bio: 'Alumni pelatihan servis elektronik.',
    communication_prefs: ['chat', 'call'],
    disability_type: null,
    alumni_reg_no: 'AL-2024-001',
    address_detail: 'Jl. Ahmad Yani No. 12, Bekasi Selatan',
    city: 'Kota Bekasi',
    district: 'Bekasi Selatan',
    lat: -6.2383,
    lng: 106.9756,
    public_lat: -6.24,
    public_lng: 106.98,
    service_radius_km: 10,
    verification_status: 'verified',
    rating_avg: 4.8,
    rating_count: 12,
    phone: '+6281234567890',
  },
  services: [
    {
      id: '55555555-5555-4555-8555-555555555555',
      title: 'Servis Kipas Angin',
      description: 'Perbaikan kipas angin rumah tangga.',
      pricing_type: 'starting_from',
      price_amount: 50000,
      min_hours: null,
      duration_estimate_min: 60,
      service_mode: 'at_customer',
      is_active: true,
      category: {
        id: 'cat-servis-elektronik',
        name: 'Servis Elektronik',
        slug: 'servis-elektronik',
        is_active: true,
      },
    },
  ],
  availability: [
    { day_of_week: 1, start_time: '08:00', end_time: '17:00' },
    { day_of_week: 2, start_time: '08:00', end_time: '17:00' },
  ],
  portfolio: [],
});

const demoAdminState = () => ({
  providers: [
    {
      id: 'aaaa1111-1111-4111-8111-111111111111',
      display_name: 'Yusuf Hidayat',
      alumni_reg_no: 'AL-2024-006',
      city: 'Kota Cimahi',
      district: 'Cimahi Utara',
      has_location: true,
      verification_status: 'pending',
      verified_at: null,
      rating_avg: 0,
      rating_count: 0,
      created_at: '2026-10-18T08:00:00.000Z',
      user: {
        id: 'bbbb1111-1111-4111-8111-111111111111',
        name: 'Yusuf Hidayat',
        email: 'yusuf@djc.test',
        phone: '+6281234567891',
        status: 'active',
      },
    },
    {
      id: 'aaaa2222-2222-4222-8222-222222222222',
      display_name: 'Deni Setiawan',
      alumni_reg_no: 'AL-2024-001',
      city: 'Kota Bekasi',
      district: 'Bekasi Selatan',
      has_location: true,
      verification_status: 'verified',
      verified_at: '2026-10-01T08:00:00.000Z',
      rating_avg: 4.8,
      rating_count: 2,
      created_at: '2026-09-20T08:00:00.000Z',
      user: {
        id: 'bbbb2222-2222-4222-8222-222222222222',
        name: 'Deni Setiawan',
        email: 'deni@djc.test',
        phone: '+6281234567892',
        status: 'active',
      },
    },
  ],
  categories: [
    {
      id: 'cccc1111-1111-4111-8111-111111111111',
      name: 'Servis Elektronik',
      slug: 'servis-elektronik',
      icon: 'wrench',
      sort_order: 1,
      is_active: true,
      services_count: 3,
    },
    {
      id: 'cccc2222-2222-4222-8222-222222222222',
      name: 'Kerajinan',
      slug: 'kerajinan',
      icon: 'gift',
      sort_order: 2,
      is_active: false,
      services_count: 0,
    },
  ],
  reviews: [
    {
      id: 'dddd1111-1111-4111-8111-111111111111',
      booking_id: 'eeee1111-1111-4111-8111-111111111111',
      rating: 5,
      comment: 'Sangat rapi dan tepat waktu.',
      is_hidden: false,
      hidden_reason: null,
      created_at: '2026-10-20T10:00:00.000Z',
      provider: { id: 'aaaa2222-2222-4222-8222-222222222222', display_name: 'Deni Setiawan' },
      customer: { id: 'bbbb3333-3333-4333-8333-333333333333', name: 'Budi Santoso' },
    },
  ],
  users: [
    {
      id: 'bbbb3333-3333-4333-8333-333333333333',
      role: 'customer',
      name: 'Budi Santoso',
      email: 'budi@djc.test',
      phone: '+6281234567890',
      status: 'active',
      created_at: '2026-09-15T08:00:00.000Z',
    },
    {
      id: 'bbbb2222-2222-4222-8222-222222222222',
      role: 'provider',
      name: 'Deni Setiawan',
      email: 'deni@djc.test',
      phone: '+6281234567892',
      status: 'active',
      created_at: '2026-09-10T08:00:00.000Z',
    },
  ],
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
  if (method === 'PUT' && path === '/me/password') {
    if (!account.user.has_password) {
      return json(
        { error: { code: 'PASSWORD_NOT_SET', message: 'Akun ini belum punya kata sandi.' } },
        409,
      );
    }
    if (body.current_password !== account.password) {
      return validationError('current_password', 'Kata sandi saat ini salah.');
    }
    account.password = body.new_password;
    return json({ data: { password_changed: true } });
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
  /** Daftar booking mentah (format backend) untuk GET/PUT /bookings & POST /reviews. */
  bookings: [],
  /** Respons error kustom untuk cancel/review, atau null. */
  cancelError: null,
  reviewError: null,
  /** Akun di balik endpoint /me; test bisa mengubah isinya (mis. `addresses = []`). */
  account: demoAccount(),
  /** Data milik provider di balik endpoint /provider/*. */
  provider: demoProviderState(),
  /** Data milik admin di balik endpoint /admin/*. */
  admin: demoAdminState(),
  reset() {
    this.calls = [];
    this.offline = false;
    this.bookingResponse = null;
    this.bookings = [];
    this.cancelError = null;
    this.reviewError = null;
    this.account = demoAccount();
    this.provider = demoProviderState();
    this.admin = demoAdminState();
    bookingSeq = 0;
    addressSeq = 0;
    providerServiceSeq = 0;
    adminCategorySeq = 0;
  },
};

let bookingSeq = 0;
let providerServiceSeq = 0;
let adminCategorySeq = 0;

export async function fakeFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method ?? 'GET').toUpperCase();
  const path = url.href.startsWith(BASE) ? url.pathname.replace('/api/v1', '') : url.pathname;
  const body = init.body ? JSON.parse(init.body) : undefined;
  fakeApi.calls.push({ method, path, search: url.search, body });

  if (fakeApi.offline) throw new TypeError('Failed to fetch');

  if (method === 'GET' && path === '/health') return json({ data: { status: 'ok' } });
  if (method === 'GET' && path === '/categories') {
    return json({
      data: CATEGORIES.map((c, idx) => ({
        id: `cat-${c.slug}`,
        slug: c.slug,
        name: c.label,
        sort_order: idx + 1,
      })),
    });
  }
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

  if (path === '/admin/dashboard' && method === 'GET') {
    const a = fakeApi.admin;
    const providers = {
      pending: a.providers.filter((p) => p.verification_status === 'pending').length,
      verified: a.providers.filter((p) => p.verification_status === 'verified').length,
      rejected: a.providers.filter((p) => p.verification_status === 'rejected').length,
    };
    return json({
      data: {
        users: {
          total: a.users.length,
          customers: a.users.filter((u) => u.role === 'customer').length,
          providers: a.users.filter((u) => u.role === 'provider').length,
          admins: 1,
          suspended: a.users.filter((u) => u.status === 'suspended').length,
        },
        providers,
        bookings: {
          total: 7,
          requested: 1,
          accepted: 1,
          in_progress: 1,
          completed: 2,
          rejected: 1,
          cancelled: 1,
        },
        reviews: {
          total: a.reviews.length,
          hidden: a.reviews.filter((r) => r.is_hidden).length,
          average_rating: 4.8,
        },
      },
    });
  }
  if (path === '/admin/providers' && method === 'GET') {
    return json({
      data: fakeApi.admin.providers,
      meta: { page: 1, limit: 50, total_items: fakeApi.admin.providers.length, total_pages: 1 },
    });
  }
  if (path === '/admin/providers' && method === 'POST') {
    const newUserId = `u-prov-${Date.now().toString(36)}`;
    const newProfileId = `p-prov-${Date.now().toString(36)}`;
    const userObj = {
      id: newUserId,
      role: 'provider',
      name: body?.name,
      email: body?.email,
      phone: body?.phone,
      status: 'active',
      created_at: '2026-11-25T08:00:00.000Z',
    };
    const providerObj = {
      id: newProfileId,
      display_name: body?.name,
      alumni_reg_no: body?.alumni_reg_no,
      city: body?.city,
      district: null,
      has_location: false,
      verification_status: 'pending',
      verified_at: null,
      rating_avg: 0,
      rating_count: 0,
      created_at: '2026-11-25T08:00:00.000Z',
      user: userObj,
    };
    fakeApi.admin.users = [userObj, ...fakeApi.admin.users];
    fakeApi.admin.providers = [providerObj, ...fakeApi.admin.providers];
    return json(
      {
        data: {
          user: userObj,
          provider_profile: { id: newProfileId, verification_status: 'pending' },
        },
      },
      201,
    );
  }
  const adminVerify = /^\/admin\/providers\/([^/]+)\/verify$/.exec(path);
  if (adminVerify && method === 'PUT') {
    const id = decodeURIComponent(adminVerify[1]);
    const row = fakeApi.admin.providers.find((p) => p.id === id);
    if (!row) return notFound('Penyedia jasa tidak ditemukan.');
    row.verification_status = body?.status ?? 'verified';
    row.verified_at = '2026-11-25T08:00:00.000Z';
    return json({
      data: {
        id: row.id,
        display_name: row.display_name,
        verification_status: row.verification_status,
        verified_at: row.verified_at,
      },
    });
  }
  if (path === '/admin/categories') {
    if (method === 'GET') return json({ data: fakeApi.admin.categories });
    if (method === 'POST') {
      adminCategorySeq += 1;
      const slug = String(body?.name ?? 'kategori')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');
      const created = {
        id: `cat-admin-${adminCategorySeq}`,
        name: body?.name,
        slug,
        icon: body?.icon ?? null,
        sort_order: body?.sort_order ?? 0,
        is_active: body?.is_active ?? true,
        services_count: 0,
      };
      fakeApi.admin.categories = [...fakeApi.admin.categories, created];
      return json({ data: created }, 201);
    }
  }
  const adminCatOne = /^\/admin\/categories\/([^/]+)$/.exec(path);
  if (adminCatOne && method === 'PUT') {
    const id = decodeURIComponent(adminCatOne[1]);
    const row = fakeApi.admin.categories.find((c) => c.id === id);
    if (!row) return notFound('Kategori tidak ditemukan.');
    Object.assign(row, body ?? {});
    return json({ data: { ...row } });
  }
  if (path === '/admin/reviews' && method === 'GET') {
    return json({
      data: fakeApi.admin.reviews,
      meta: { page: 1, limit: 50, total_items: fakeApi.admin.reviews.length, total_pages: 1 },
    });
  }
  const adminReviewMod = /^\/admin\/reviews\/([^/]+)\/moderate$/.exec(path);
  if (adminReviewMod && method === 'PUT') {
    const id = decodeURIComponent(adminReviewMod[1]);
    const row = fakeApi.admin.reviews.find((r) => r.id === id);
    if (!row) return notFound('Ulasan tidak ditemukan.');
    row.is_hidden = Boolean(body?.is_hidden);
    row.hidden_reason = row.is_hidden ? (body?.reason ?? null) : null;
    return json({ data: { ...row } });
  }
  if (path === '/admin/users' && method === 'GET') {
    return json({
      data: fakeApi.admin.users,
      meta: { page: 1, limit: 50, total_items: fakeApi.admin.users.length, total_pages: 1 },
    });
  }
  const adminUserStatus = /^\/admin\/users\/([^/]+)\/(suspend|activate)$/.exec(path);
  if (adminUserStatus && method === 'PUT') {
    const id = decodeURIComponent(adminUserStatus[1]);
    const action = adminUserStatus[2];
    const row = fakeApi.admin.users.find((u) => u.id === id);
    if (!row) return notFound('Pengguna tidak ditemukan.');
    row.status = action === 'suspend' ? 'suspended' : 'active';
    return json({ data: { user: { ...row }, cancelled_bookings: 0 } });
  }

  if (path === '/provider/profile') {
    if (method === 'GET') return json({ data: fakeApi.provider.profile });
    if (method === 'PUT') {
      fakeApi.provider.profile = { ...fakeApi.provider.profile, ...(body ?? {}) };
      return json({ data: fakeApi.provider.profile });
    }
  }
  if (path === '/provider/availability') {
    if (method === 'GET') return json({ data: fakeApi.provider.availability });
    if (method === 'PUT') {
      fakeApi.provider.availability = body?.availability ?? [];
      return json({ data: fakeApi.provider.availability });
    }
  }
  if (path === '/provider/portfolio' && method === 'GET') {
    return json({ data: fakeApi.provider.portfolio });
  }
  if (path === '/provider/services') {
    if (method === 'GET') return json({ data: fakeApi.provider.services });
    if (method === 'POST') {
      providerServiceSeq += 1;
      const cat = CATEGORIES.find((c) => `cat-${c.slug}` === body?.category_id);
      const created = {
        id: `svc-created-${providerServiceSeq}`,
        ...body,
        is_active: body?.is_active ?? true,
        category: {
          id: body?.category_id,
          name: cat?.label ?? 'Layanan',
          slug: cat?.slug ?? 'lainnya',
          is_active: true,
        },
      };
      fakeApi.provider.services = [created, ...fakeApi.provider.services];
      return json({ data: created }, 201);
    }
  }
  const ownServiceOne = /^\/provider\/services\/([^/]+)$/.exec(path);
  if (ownServiceOne && method === 'PUT') {
    const id = decodeURIComponent(ownServiceOne[1]);
    const row = fakeApi.provider.services.find((s) => s.id === id);
    if (!row) return notFound('Layanan tidak ditemukan.');
    Object.assign(row, body ?? {});
    return json({ data: { ...row } });
  }

  const bookingAction = /^\/bookings\/([^/]+)\/(accept|reject|start|complete)$/.exec(path);
  if ((method === 'PUT' || method === 'POST') && bookingAction) {
    const id = decodeURIComponent(bookingAction[1]);
    const action = bookingAction[2];
    const row = fakeApi.bookings.find((b) => b.id === id);
    if (!row) return notFound('Pesanan tidak ditemukan.');
    if (action === 'accept') {
      row.status = 'accepted';
    } else if (action === 'reject') {
      row.status = 'rejected';
      row.status_reason = body?.reason ?? null;
    } else if (action === 'start') {
      row.status = 'in_progress';
    } else if (action === 'complete') {
      row.status = 'completed';
      if (body?.actual_quantity !== undefined) {
        row.actual_quantity = body.actual_quantity;
        row.final_total = Math.round(Number(row.unit_price_snapshot ?? 0) * body.actual_quantity);
      } else if (body?.final_total !== undefined) {
        row.final_total = body.final_total;
      } else {
        row.final_total = Number(row.estimated_total ?? 0);
      }
    }
    return json({ data: { ...row } });
  }

  if (method === 'GET' && path === '/bookings') {
    return json({
      data: fakeApi.bookings,
      meta: {
        page: 1,
        limit: 50,
        total_items: fakeApi.bookings.length,
        total_pages: fakeApi.bookings.length ? 1 : 0,
      },
    });
  }

  const bookingOne = /^\/bookings\/([^/]+)$/.exec(path);
  if (method === 'GET' && bookingOne) {
    const id = decodeURIComponent(bookingOne[1]);
    const row = fakeApi.bookings.find((b) => b.id === id);
    return row ? json({ data: row }) : notFound('Pesanan tidak ditemukan.');
  }

  const bookingCancel = /^\/bookings\/([^/]+)\/cancel$/.exec(path);
  if ((method === 'PUT' || method === 'POST') && bookingCancel) {
    if (fakeApi.cancelError) return json(...fakeApi.cancelError);
    const id = decodeURIComponent(bookingCancel[1]);
    const row = fakeApi.bookings.find((b) => b.id === id);
    if (!row) return notFound('Pesanan tidak ditemukan.');
    row.status = 'cancelled';
    row.cancelled_by = 'customer';
    row.status_reason = body?.reason ?? null;
    if (row.provider) {
      row.provider = { ...row.provider, phone: null, address_detail: null };
    }
    row.history = [
      ...(row.history ?? []),
      {
        from_status: 'accepted',
        to_status: 'cancelled',
        changed_by_role: 'customer',
        reason: body?.reason ?? null,
        created_at: '2026-11-25T07:30:00.000Z',
      },
    ];
    return json({ data: row });
  }

  const bookingReview = /^\/bookings\/([^/]+)\/reviews?$/.exec(path);
  if (method === 'POST' && bookingReview) {
    if (fakeApi.reviewError) return json(...fakeApi.reviewError);
    const id = decodeURIComponent(bookingReview[1]);
    const row = fakeApi.bookings.find((b) => b.id === id);
    if (!row) return notFound('Pesanan tidak ditemukan.');
    row.can_review = false;
    return json(
      {
        data: {
          id: 'rev-1',
          booking_id: row.id,
          rating: body?.rating,
          comment: body?.comment ?? null,
        },
      },
      201,
    );
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
