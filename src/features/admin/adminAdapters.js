import { avatarColor, initialsOf } from './adminFormat';

const PROVIDER_STATUS_MAP = {
  pending: 'menunggu',
  verified: 'disetujui',
  rejected: 'ditolak',
};

const USER_ROLE_MAP = {
  customer: 'pengguna',
  provider: 'penyedia',
  admin: 'pengelola',
};

const USER_STATUS_MAP = {
  active: 'aktif',
  suspended: 'disuspensi',
};

const CATEGORY_ICON_ALIAS = {
  kebersihan: 'sparkle',
  'servis-elektronik': 'wrench',
  jahit: 'scissors',
  kuliner: 'food',
  kerajinan: 'gift',
  desain: 'palette',
  terapi: 'hand',
  lainnya: 'tag',
};

/** Petakan ikon/slug backend ke kunci ikon yang dikenal `CategoryIcon`. */
export function mapCategoryIcon(icon, slug) {
  const key = String(icon || slug || '').toLowerCase();
  return CATEGORY_ICON_ALIAS[key] ?? (icon || 'tag');
}

/** Mengubah baris `GET /admin/providers` ke bentuk item verifikasi di AdminContext. */
export function fromApiAdminProvider(row) {
  const name = row.display_name || row.user?.name || 'Penyedia Jasa';
  const status = PROVIDER_STATUS_MAP[row.verification_status] ?? 'menunggu';
  const hasLocation = Boolean(row.has_location);
  const city = row.city || '-';
  return {
    id: row.id,
    userId: row.user?.id ?? null,
    name,
    initials: initialsOf(name),
    color: avatarColor(name),
    category: '',
    city,
    registeredAt: row.created_at ?? new Date().toISOString(),
    email: row.user?.email || '-',
    phone: row.user?.phone || '-',
    alumni: row.alumni_reg_no
      ? {
          file: `Nomor Alumni ${row.alumni_reg_no}`,
          detail: `Terdaftar di UPTD PPSGHD · ${city}`,
        }
      : null,
    services: [],
    address: hasLocation
      ? `${row.district ? `${row.district}, ` : ''}${city}`
      : 'Alamat & koordinat lokasi belum dilengkapi penyedia.',
    workDays: [1, 2, 3, 4, 5, 6],
    hours: 'Mengikuti jadwal operasional penyedia',
    description: row.district
      ? `Mitra penyedia jasa berdomisili di ${row.district}, ${city}.`
      : `Mitra penyedia jasa berdomisili di ${city}.`,
    status,
    decision:
      status !== 'menunggu'
        ? {
            by: 'Admin UPTD PPSGHD',
            at: row.verified_at ?? row.created_at ?? new Date().toISOString(),
            note: '',
          }
        : null,
    checklist: {
      portfolio: false,
      data: Boolean(row.user?.email && row.user?.phone),
      alumni: Boolean(row.alumni_reg_no),
      service: true,
      location: hasLocation,
      schedule: true,
    },
  };
}

/** Mengubah baris `GET /admin/categories` ke bentuk item kategori di AdminContext. */
export function fromApiAdminCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: mapCategoryIcon(row.icon, row.slug),
    description: row.slug ? `Slug: ${row.slug}` : '',
    services: Number(row.services_count ?? 0),
    active: Boolean(row.is_active),
    sortOrder: Number(row.sort_order ?? 0),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

/** Mengubah baris `GET /admin/reviews` ke bentuk item ulasan di AdminContext. */
export function fromApiAdminReview(row) {
  const customerName = row.customer?.name || 'Pelanggan';
  const hidden = Boolean(row.is_hidden);
  return {
    id: row.id,
    bookingCode: row.booking_id
      ? `BK-${String(row.booking_id).slice(0, 8).toUpperCase()}`
      : 'BK-UNKNOWN',
    rating: Number(row.rating ?? 0),
    text: row.comment || '(Tanpa komentar tertulis)',
    status: hidden ? 'disembunyikan' : 'ditampilkan',
    report: null,
    moderation: hidden
      ? {
          by: 'Admin UPTD PPSGHD',
          at: row.created_at ?? new Date().toISOString(),
          reason: row.hidden_reason || 'Disembunyikan oleh admin.',
        }
      : null,
    author: {
      name: customerName,
      initials: initialsOf(customerName),
      color: avatarColor(customerName),
    },
    provider: row.provider?.display_name || 'Penyedia Jasa',
    category: 'Layanan',
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

/** Mengubah baris `GET /admin/users` ke bentuk item user di AdminContext. */
export function fromApiAdminUser(row) {
  const name = row.name || row.full_name || 'Pengguna';
  const role = USER_ROLE_MAP[row.role] ?? 'pengguna';
  const status = USER_STATUS_MAP[row.status] ?? 'aktif';
  return {
    id: row.id,
    rawRole: row.role,
    name,
    initials: initialsOf(name),
    color: avatarColor(name),
    email: row.email || '-',
    phone: row.phone || '-',
    role,
    position: row.role === 'admin' ? 'Admin UPTD PPSGHD' : '',
    city: 'Jawa Barat',
    region: 'Jawa Barat',
    status,
    joinedAt: row.created_at ?? new Date().toISOString(),
    lastActiveAt: null,
    suspension:
      status === 'disuspensi'
        ? {
            reason: 'Akun dinonaktifkan oleh admin.',
            by: 'Admin UPTD PPSGHD',
            at: row.created_at ?? new Date().toISOString(),
          }
        : null,
    invite: null,
  };
}
