import { addDays, startOfDay, toISODate } from '@/features/booking/schedule';

const AVATAR_COLORS = ['#0b3c6e', '#0b6b67', '#26324a', '#3d5a80', '#1e5b70', '#5c4b7d'];

export function initialsOf(name = '') {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'P';
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase();
}

export function colorOf(name = '') {
  const sum = [...String(name)].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

/** Status pesanan pada Dashboard Penyedia mengikuti status resmi backend. */
export const PROVIDER_ORDER_STATUS = {
  requested: {
    label: 'Baru',
    tone: 'danger',
    primaryAction: 'Terima',
    secondaryAction: 'Tolak',
  },
  accepted: {
    label: 'Diterima',
    tone: 'warning',
    primaryAction: 'Mulai',
    secondaryAction: 'Batalkan',
  },
  in_progress: {
    label: 'Diproses',
    tone: 'info',
    primaryAction: 'Selesai',
  },
  completed: {
    label: 'Selesai',
    tone: 'success',
  },
  rejected: {
    label: 'Ditolak',
    tone: 'neutral',
  },
  cancelled: {
    label: 'Dibatalkan',
    tone: 'neutral',
  },
};

export const PRICING_TYPE_LABELS = {
  fixed: 'Harga tetap',
  starting_from: 'Mulai dari',
  hourly: 'Per jam',
};

export const SERVICE_MODE_LABELS = {
  at_customer: 'Ke lokasi pelanggan',
  at_provider: 'Di tempat penyedia',
  both: 'Keduanya',
};

export const COMMUNICATION_PREF_OPTIONS = [
  { value: 'chat', label: 'Chat aplikasi' },
  { value: 'call', label: 'Telepon' },
  { value: 'video_call', label: 'Video call' },
  { value: 'bisindo', label: 'Bahasa Isyarat (BISINDO)' },
];

const DEMO_STATUS_MAP = {
  baru: 'requested',
  menunggu: 'accepted',
  diproses: 'in_progress',
  selesai: 'completed',
};

function parseLocalDate(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(isoDate ?? ''));
  if (!match) return startOfDay(new Date());
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function parseStartHour(time) {
  const hour = Number(String(time ?? '09:00').slice(0, 2));
  return Number.isFinite(hour) ? hour : 9;
}

/** Mengubah booking dari respons API backend (`GET /bookings`) ke bentuk tabel Dashboard Penyedia. */
export function fromApiProviderBooking(row) {
  const customerName = row.customer?.name || 'Pelanggan';
  const startTime = String(row.start_time ?? '09:00').slice(0, 5);
  const quantity = Number(row.quantity ?? 1) || 1;
  const pricingType = row.pricing_type_snapshot ?? 'fixed';
  const hours = pricingType === 'hourly' ? Math.max(1, Math.ceil(quantity)) : 2;
  const area =
    row.location?.area || (row.service_mode === 'at_provider' ? 'Di tempat penyedia' : '');
  const address =
    row.location?.address ||
    (row.service_mode === 'at_provider'
      ? row.provider?.address_detail || 'Di lokasi penyedia jasa'
      : area || 'Alamat terlihat setelah pesanan diterima');

  return {
    id: row.id,
    code: row.code,
    status: row.status,
    customer: customerName,
    customerPhone: row.customer?.phone ?? null,
    initials: initialsOf(customerName),
    color: colorOf(customerName),
    city: area || row.provider?.city || '',
    service: row.service?.title || 'Layanan',
    serviceId: row.service?.id ?? null,
    date: parseLocalDate(row.scheduled_date),
    scheduledDate: String(row.scheduled_date ?? '').slice(0, 10),
    startTime,
    start: parseStartHour(startTime),
    hours,
    serviceMode: row.service_mode ?? 'at_customer',
    address,
    note: row.customer_note || '',
    pricingType,
    unitPrice: Number(row.unit_price_snapshot ?? 0),
    quantity,
    estimatedTotal: Number(row.estimated_total ?? 0),
    actualQuantity: row.actual_quantity != null ? Number(row.actual_quantity) : null,
    finalTotal: row.final_total != null ? Number(row.final_total) : null,
    statusReason: row.status_reason || '',
    cancelledBy: row.cancelled_by ?? null,
    createdAt: row.created_at ?? null,
  };
}

/** Menyelaraskan pesanan contoh lokal ke bentuk status backend yang sama. */
export function fromSampleProviderOrder(order) {
  const status = DEMO_STATUS_MAP[order.status] ?? order.status;
  return {
    ...order,
    code: order.code ?? `DEMO-${order.id.toUpperCase()}`,
    status,
    scheduledDate: toISODate(order.date),
    startTime: `${String(order.start).padStart(2, '0')}:00`,
    serviceMode: 'at_customer',
    pricingType: order.pricingType ?? 'starting_from',
    unitPrice: order.unitPrice ?? 75000,
    quantity: order.quantity ?? 1,
    estimatedTotal: order.estimatedTotal ?? 75000,
    actualQuantity: order.actualQuantity ?? null,
    finalTotal: order.finalTotal ?? null,
    statusReason: order.statusReason ?? '',
    cancelledBy: order.cancelledBy ?? null,
    createdAt: order.date.toISOString(),
  };
}

/** Bangun payload `PUT /bookings/:id/complete` sesuai tipe tarif pesanan. */
export function buildCompletePayload(order, { actualQuantity, finalTotal } = {}) {
  if (order.pricingType === 'hourly') {
    const qty = Number(actualQuantity);
    if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty * 2)) {
      return { error: 'Jumlah jam aktual harus kelipatan 0,5 dan lebih dari 0.' };
    }
    return { payload: { actual_quantity: qty } };
  }
  if (order.pricingType === 'starting_from') {
    const total = Number(finalTotal);
    if (!Number.isFinite(total) || !Number.isInteger(total) || total <= 0) {
      return { error: 'Total akhir harus berupa angka bulat positif.' };
    }
    if (total < order.unitPrice) {
      return { error: `Total akhir minimal Rp${order.unitPrice.toLocaleString('id-ID')}.` };
    }
    return { payload: { final_total: total } };
  }
  return { payload: {} };
}

/** Hitung ringkasan statistik, tren 7 hari, dan kelengkapan profil dari data live penyedia. */
export function computeProviderMetrics({ orders, services, profile, portfolio = [], today }) {
  const baseToday = startOfDay(today ?? new Date());
  const currentMonth = baseToday.getMonth();
  const currentYear = baseToday.getFullYear();

  const isCountedOrder = (o) => o.status !== 'rejected' && o.status !== 'cancelled';
  const orderValue = (o) => Number(o.finalTotal ?? o.estimatedTotal ?? 0);

  const monthOrders = orders.filter(
    (o) =>
      isCountedOrder(o) &&
      o.date.getMonth() === currentMonth &&
      o.date.getFullYear() === currentYear,
  );
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const monthIncome = completedOrders
    .filter((o) => o.date.getMonth() === currentMonth && o.date.getFullYear() === currentYear)
    .reduce((sum, o) => sum + orderValue(o), 0);
  const totalIncome = completedOrders.reduce((sum, o) => sum + orderValue(o), 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const iso = toISODate(addDays(baseToday, i - 6));
    return orders.filter((o) => isCountedOrder(o) && toISODate(o.date) === iso).length;
  });

  const activeServices = services.filter((s) => s.is_active).length;

  const checklist = [
    { label: 'Foto/Avatar profil', weight: 20, done: Boolean(profile?.photo_url) },
    {
      label: 'Informasi dasar & alamat',
      weight: 30,
      done: Boolean(
        profile?.display_name && profile?.city && profile?.address_detail && profile?.phone,
      ),
    },
    { label: 'Layanan aktif', weight: 35, done: activeServices > 0 },
    { label: 'Portofolio hasil kerja', weight: 15, done: portfolio.length > 0 },
  ];
  const completeness = checklist.reduce((sum, item) => sum + (item.done ? item.weight : 0), 0);

  return {
    monthOrderCount: monthOrders.length,
    totalOrderCount: orders.filter(isCountedOrder).length,
    monthIncome,
    totalIncome,
    activeServices,
    totalServices: services.length,
    last7Days,
    checklist,
    completeness,
  };
}
