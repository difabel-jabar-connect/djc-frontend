import kebersihanCardIcon from '@/assets/icons/cat-kebersihan-card.svg';
import { getCategory } from '@/features/search/catalog';

/**
 * Adapter respons backend (djc-backend) → bentuk data yang dipakai komponen tampilan
 * (kartu hasil, peta SIG, profil, pemesanan). Komponen tidak membaca field API langsung,
 * jadi perubahan kontrak cukup disesuaikan di sini.
 */

/** Warna avatar inisial: empat nada palet merek, dipilih stabil dari id penyedia. */
const AVATAR_COLORS = ['#0b3c6e', '#0b6b67', '#3d5a80', '#26324a'];

export function avatarColorFor(id = '') {
  let hash = 0;
  for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

/** "Siti Nurjanah" → "SN". */
export function initialsOf(name = '') {
  return (
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('') || '?'
  );
}

/** "Kota Bandung" → "Bandung"; "Kabupaten Bogor" → "Kab. Bogor". */
export function cityLabel(city = '') {
  return String(city)
    .trim()
    .replace(/^kota\s+/i, '')
    .replace(/^kabupaten\s+/i, 'Kab. ');
}

/** Nama dasar kota untuk filter: "Kota Bandung", "Kab. Bandung", "Bandung" → "bandung". */
export const cityKey = (city = '') =>
  cityLabel(city)
    .replace(/^kab\.\s+/i, '')
    .toLocaleLowerCase('id-ID');

/** Ikon kategori dari katalog lokal (kartu memakai varian ikon kebersihan khusus). */
export function categoryIconFor(slug) {
  if (slug === 'kebersihan') return kebersihanCardIcon;
  return getCategory(slug)?.icon ?? null;
}

/** Satuan harga untuk tampilan: per jam → "jam"; harga tetap/mulai dari → tanpa satuan. */
export const priceUnitOf = (pricingType) => (pricingType === 'hourly' ? 'jam' : null);

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

/** "120" menit → "Estimasi 2 jam"; "90" → "Estimasi 1,5 jam"; "45" → "Estimasi 45 menit". */
export function estimateLabel(minutes) {
  if (!minutes) return null;
  if (minutes < 60) return `Estimasi ${minutes} menit`;
  const hours = minutes / 60;
  return `Estimasi ${hours.toLocaleString('id-ID', { maximumFractionDigits: 1 })} jam`;
}

/**
 * Hasil GET /services (satu baris per layanan) → satu kartu per penyedia.
 * Urutan mengikuti kemunculan pertama (hasil sort backend dipertahankan); harga kartu =
 * harga termurah di antara layanan penyedia yang cocok dengan filter.
 */
export function groupServicesByProvider(services = []) {
  const byProvider = new Map();
  for (const service of services) {
    const provider = service.provider ?? {};
    const current = byProvider.get(provider.id);
    const price = Number(service.price_amount);
    if (current) {
      current.serviceIds.push(service.id);
      if (price < current.priceFrom) {
        current.priceFrom = price;
        current.priceUnit = priceUnitOf(service.pricing_type);
      }
      continue;
    }
    const slug = service.category?.slug ?? '';
    const city = cityLabel(provider.city);
    byProvider.set(provider.id, {
      id: provider.id,
      name: provider.display_name ?? 'Penyedia',
      initials: initialsOf(provider.display_name),
      avatarColor: avatarColorFor(provider.id),
      photoUrl: provider.photo_url ?? null,
      rating: toNumber(provider.rating_avg) ?? 0,
      reviewCount: provider.rating_count ?? 0,
      categorySlug: slug,
      category: getCategory(slug)?.label ?? service.category?.name ?? '',
      categoryIcon: categoryIconFor(slug),
      city,
      cityRaw: provider.city ?? '',
      district: provider.district ?? null,
      address: [provider.district, city].filter(Boolean).join(', '),
      lat: toNumber(provider.public_lat),
      lng: toNumber(provider.public_lng),
      description: service.description || service.title,
      priceFrom: price,
      priceUnit: priceUnitOf(service.pricing_type),
      serviceIds: [service.id],
    });
  }
  // Penyedia tanpa koordinat publik tetap tampil di daftar, tetapi tidak di peta.
  return [...byProvider.values()];
}

const pad = (n) => String(n).padStart(2, '0');
const toMinutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const clock = (minutes) => `${pad(Math.floor(minutes / 60))}.${pad(minutes % 60)}`;

/** Jam layanan untuk tampilan, mis. "08.00 – 17.00 WIB" (paling awal – paling akhir). */
export function hoursLabel(availability = []) {
  if (!availability.length) return 'Belum ada jadwal';
  const start = Math.min(...availability.map((slot) => toMinutes(slot.start_time)));
  const end = Math.max(...availability.map((slot) => toMinutes(slot.end_time)));
  return `${clock(start)} – ${clock(end)} WIB`;
}

/** Hari buka (0 = Minggu … 6 = Sabtu) dari jadwal penyedia. */
export const workDaysFrom = (availability = []) =>
  [...new Set(availability.map((slot) => slot.day_of_week))].sort((a, b) => a - b);

/** Layanan profil (P3) → paket di halaman profil & langkah 1 pemesanan. */
export function toPackage(service) {
  const hourly = service.pricing_type === 'hourly';
  return {
    id: service.id,
    title: service.title,
    priceFrom: Number(service.price_amount),
    priceUnit: priceUnitOf(service.pricing_type),
    pricingType: service.pricing_type,
    minHours: hourly ? Number(service.min_hours) || 1 : null,
    serviceMode: service.service_mode,
    categorySlug: service.category?.slug ?? '',
    description: service.category?.name ?? '',
    estimate: estimateLabel(service.duration_estimate_min),
  };
}

/**
 * Profil publik penyedia (GET /providers/:id) → model profil yang dipakai halaman Profil
 * Penyedia dan Pesan Layanan. Bagian yang belum ada di API (ulasan publik, waktu respons,
 * statistik) dikosongkan sehingga bagiannya disembunyikan oleh UI.
 */
export function toProfile(data) {
  const packages = (data.services ?? []).map(toPackage);
  const first = packages[0];
  const slug = first?.categorySlug ?? '';
  const city = cityLabel(data.city);
  const availability = data.availability ?? [];
  const cheapest = packages.reduce(
    (min, pkg) => (min === null || pkg.priceFrom < min ? pkg.priceFrom : min),
    null,
  );
  return {
    id: data.id,
    name: data.display_name,
    initials: initialsOf(data.display_name),
    avatarColor: avatarColorFor(data.id),
    photoUrl: data.photo_url ?? null,
    rating: toNumber(data.rating_avg) ?? 0,
    reviewCount: data.rating_count ?? 0,
    categorySlug: slug,
    category: getCategory(slug)?.label ?? first?.description ?? '',
    categoryLabel: getCategory(slug)?.label ?? first?.description ?? 'Layanan',
    categoryIcon: categoryIconFor(slug),
    city,
    cityRaw: data.city ?? '',
    district: data.district ?? null,
    address: [data.district, city].filter(Boolean).join(', '),
    lat: toNumber(data.public_lat),
    lng: toNumber(data.public_lng),
    description: data.bio ?? '',
    about: data.bio ? [data.bio] : [],
    skills: data.skills ?? [],
    communicationPrefs: data.communication_prefs ?? [],
    serviceRadiusKm: data.service_radius_km ?? null,
    priceFrom: cheapest ?? 0,
    priceUnit: null,
    verified: true,
    online: false,
    responseTime: null,
    alumniNote: null,
    quote: null,
    serviceAreas: [city].filter(Boolean),
    experience: null,
    stats: {},
    hours: hoursLabel(availability),
    paymentMethods: ['transfer', 'ewallet', 'cod'],
    highlights: ['Penyedia Terverifikasi'],
    joinedYear: null,
    reviews: [],
    areaMap: null,
    banner: null,
    availability,
    workDays: workDaysFrom(availability),
    packages,
  };
}
