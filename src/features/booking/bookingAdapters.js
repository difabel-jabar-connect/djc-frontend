import { getCategory } from '@/features/search/catalog';
import { isBackendId } from '@/features/chat/chatSync';

/**
 * Adapter respons booking backend (`djc-backend` src/routes/bookings.js `toBooking`)
 * ke bentuk objek booking yang dipakai UI Pelanggan (`CustomerBookingsPage`,
 * `BookingDetailPage`, `CustomerHome`, `BookingChatPage`).
 */

export const STATUS_FROM_API = {
  requested: 'menunggu',
  accepted: 'diterima',
  in_progress: 'berjalan',
  completed: 'selesai',
  cancelled: 'dibatalkan',
  rejected: 'ditolak',
};

const MODE_LABEL = {
  at_customer: 'Penyedia datang ke lokasi Anda',
  at_provider: 'Anda datang ke lokasi penyedia',
};

const ACTOR_LABEL = {
  customer: 'Anda',
  provider: 'Penyedia',
  admin: 'Admin',
  system: 'Sistem',
};

const AVATAR_PALETTE = ['#0b3c6e', '#1a9a94', '#1d4ed8', '#0f766e', '#7c2d12', '#4c1d95'];

function avatarColorFor(id) {
  let hash = 0;
  for (const ch of String(id ?? '')) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsOf(name) {
  return String(name ?? 'P')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

/** "Kota Bandung" → "Bandung" agar konsisten dengan label kota di UI. */
function cityLabel(city) {
  return String(city ?? '')
    .replace(/^(Kota|Kabupaten|Kab\.)\s+/i, '')
    .trim();
}

/**
 * Stempel ISO UTC dari backend (`2026-10-22T07:30:00.000Z`) → `YYYY-MM-DDTHH:mm` WIB.
 * Jika sudah berupa stempel lokal (`YYYY-MM-DDTHH:mm`), dikembalikan apa adanya.
 */
export function toWibStamp(iso) {
  if (!iso) return '';
  const text = String(iso);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text.slice(0, 16);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

function remainingAutoCancelHours(createdAt, nowMs = Date.now()) {
  if (!createdAt) return 24;
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return 24;
  const remaining = Math.ceil((createdMs + 24 * 3600 * 1000 - nowMs) / (3600 * 1000));
  return Math.max(1, Math.min(24, remaining));
}

export const isBackendBooking = (booking) => isBackendId(booking?.id);

/**
 * Mengubah satu objek booking dari `GET /bookings`, `GET /bookings/:id`, atau
 * `PUT /bookings/:id/cancel` menjadi model tampilan pelanggan.
 */
export function fromApiBooking(row, { nowMs = Date.now() } = {}) {
  const status = STATUS_FROM_API[row.status] ?? 'menunggu';
  const hourly = row.pricing_type_snapshot === 'hourly';
  const startTime = String(row.start_time ?? '09:00').slice(0, 5);
  const start = Number(startTime.slice(0, 2)) || 9;
  const quantity = Number(row.quantity) || 1;
  const unitPrice = Number(row.unit_price_snapshot) || 0;
  const estimatedTotal =
    row.estimated_total != null ? Number(row.estimated_total) : Math.round(unitPrice * quantity);
  const finalTotal = row.final_total != null ? Number(row.final_total) : null;

  const providerName = row.provider?.display_name || 'Penyedia layanan';
  const categorySlug = row.service?.category_slug ?? '';
  const categoryLabel = row.service?.category_name ?? getCategory(categorySlug)?.label ?? 'Layanan';

  // Privasi kontak (BE-07 / NFR-SEC-03): backend hanya mengirim phone / address_detail
  // saat status `accepted` atau `in_progress`. Selain itu keduanya bernilai null.
  const phone = row.provider?.phone ?? null;
  const address = row.provider?.address_detail ?? null;
  const contact = phone || address ? { phone, address } : null;

  const createdAtWib = toWibStamp(row.created_at);
  const history =
    Array.isArray(row.history) && row.history.length
      ? row.history.map((entry) => ({
          status: STATUS_FROM_API[entry.to_status] ?? status,
          by: ACTOR_LABEL[entry.changed_by_role] ?? 'Sistem',
          at: toWibStamp(entry.created_at),
          reason: entry.reason ?? null,
        }))
      : [
          {
            status,
            by: row.cancelled_by ? (ACTOR_LABEL[row.cancelled_by] ?? 'Sistem') : 'Anda',
            at: createdAtWib,
            reason: row.status_reason ?? null,
          },
        ];

  return {
    id: row.id,
    code: row.code,
    status,
    providerId: row.provider?.id ?? '',
    provider: {
      id: row.provider?.id ?? '',
      name: providerName,
      initials: initialsOf(providerName),
      avatarColor: avatarColorFor(row.provider?.id ?? providerName),
      city: cityLabel(row.provider?.city),
      district: row.provider?.district ?? null,
      rating: Number(row.provider?.rating_avg) || 0,
      reviewCount: Number(row.provider?.rating_count) || 0,
      category: categoryLabel,
      categorySlug,
    },
    service: row.service?.title ?? 'Layanan',
    mode: MODE_LABEL[row.service_mode] ?? 'Penyedia datang ke lokasi Anda',
    serviceMode: row.service_mode ?? 'at_customer',
    date: String(row.scheduled_date ?? '').slice(0, 10),
    start,
    startTime,
    hours: hourly ? quantity : 1,
    unitPrice,
    unit: hourly ? 'jam' : 'layanan',
    quantity,
    estimatedTotal,
    finalTotal,
    note: row.customer_note ?? '',
    contact,
    autoCancelHours:
      status === 'menunggu' ? remainingAutoCancelHours(row.created_at, nowMs) : undefined,
    reviewed: status === 'selesai' ? !row.can_review : false,
    canReview: Boolean(row.can_review),
    cancelReason: status === 'dibatalkan' ? (row.status_reason ?? undefined) : undefined,
    rejectReason: status === 'ditolak' ? (row.status_reason ?? undefined) : undefined,
    cancelledBy: row.cancelled_by ?? null,
    unread: false,
    hasFullHistory: Array.isArray(row.history) && row.history.length > 0,
    history,
  };
}
