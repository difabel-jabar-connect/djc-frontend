import { addressLine, addressesFor } from './addressBook';
import { providerSnapshot } from './bookingProvider';
import { findPaymentMethod } from './payment';
import { formatRupiah } from '@/lib/format';
import {
  MAX_DURATION,
  MIN_DURATION,
  formatHourRange,
  parseISODate,
  startHourOf,
  startSlotsFor,
  toApiTime,
  toISODate,
} from './schedule';

/**
 * Alur Pesan Layanan 4 langkah (desain HTML pesan-layanan-1…5).
 * Draf disimpan di sessionStorage per penyedia agar tidak hilang saat halaman dimuat ulang
 * di tengah alur. Langkah 4 mengirim POST /bookings (lihat draftToApiPayload).
 */
export const BOOKING_STEPS = ['Pilih Layanan', 'Jadwal', 'Detail Pesanan', 'Kirim Pesanan'];

export const NOTE_MAX = 300;
export const DEFAULT_DURATION = 2;
export const DEFAULT_RADIUS_KM = 5;
export const RESPONSE_HOURS = 24;
export const PHONE_PATTERN = /^8\d{7,12}$/;

const storageKey = (providerId) => `djc.booking.${providerId}`;
const originKey = (providerId) => `djc.booking.${providerId}.asal`;

/** Halaman asal pemesanan (untuk tombol Kembali), bertahan saat masuk akun / muat ulang. */
export function loadOrigin(providerId) {
  try {
    return sessionStorage.getItem(originKey(providerId));
  } catch {
    return null;
  }
}

export function saveOrigin(providerId, path) {
  try {
    sessionStorage.setItem(originKey(providerId), path);
  } catch {
    // abaikan: tombol Kembali memakai profil penyedia
  }
}

/** "0812-3456 7890" / "+62 812…" → "8123456 7890" tanpa awalan 0/62/+62 & non-angka. */
export const normalizePhone = (value) =>
  String(value)
    .replace(/\D/g, '')
    .replace(/^(62|0)/, '');

export const isHourly = (pkg) => pkg?.priceUnit === 'jam';

/** Durasi minimal paket: `min_hours` layanan per jam, selain itu 1. */
export const minHoursOf = (pkg) => (isHourly(pkg) ? Math.max(pkg.minHours ?? 1, MIN_DURATION) : 1);

/** Jam mulai yang tersedia untuk tanggal & paket di draf (dari jadwal penyedia). */
export function bookableSlots({ draft, profile, pkg, now }) {
  return startSlotsFor(profile.availability, parseISODate(draft.date), {
    minHours: minHoursOf(pkg),
    ...(now ? { now } : {}),
  });
}

export const priceLabel = (pkg) =>
  `${formatRupiah(pkg.priceFrom)}${pkg.priceUnit ? `/${pkg.priceUnit}` : ''}`;

/** "09.00–11.00 WIB (2 jam)" atau "09.00 WIB" untuk paket non-per-jam. */
export function timeLabel(start, hours, hourly) {
  if (!start) return '';
  return hourly ? `${formatHourRange(start, hours)} WIB (${hours} jam)` : `${start} WIB`;
}

export function createDraft({ profile, user, packageId, date }) {
  const addresses = addressesFor(user);
  return {
    packageId: profile.packages.find((p) => p.id === packageId)?.id ?? profile.packages[0]?.id,
    date: date ? toISODate(date) : '',
    start: '',
    duration: DEFAULT_DURATION,
    addressId: (addresses.find((a) => a.primary) ?? addresses[0])?.id ?? '',
    customAddress: '',
    note: '',
    phone: '',
    paymentMethod: '',
    agree: false,
  };
}

export function loadDraft(providerId) {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey(providerId)));
  } catch {
    return null;
  }
}

export function saveDraft(providerId, draft) {
  try {
    sessionStorage.setItem(storageKey(providerId), JSON.stringify(draft));
  } catch {
    // Penyimpanan diblokir: draf tetap ada selama halaman tidak dimuat ulang.
  }
}

export function clearDraft(providerId) {
  try {
    sessionStorage.removeItem(storageKey(providerId));
  } catch {
    // abaikan
  }
}

/** Alamat terpilih sebagai objek tampilan, atau null bila belum dipilih. */
export function selectedAddress(draft, user) {
  // Draf lama (sebelum ada daftar alamat) masih bisa berisi alamat ketik bebas.
  if (draft.addressId === 'lain') {
    const text = draft.customAddress?.trim();
    return text ? { id: 'lain', label: 'Alamat lain', text } : null;
  }
  const address = addressesFor(user).find((a) => a.id === draft.addressId);
  return address ? { ...address, text: addressLine(address) } : null;
}

/**
 * Durasi efektif: paket per jam memakai durasi terpilih, dijepit antara minimal paket dan
 * batas slot jam mulai (jam tutup penyedia); selain per jam selalu 1.
 */
export function effectiveDuration(draft, pkg, slots = []) {
  if (!isHourly(pkg)) return 1;
  const limit = slots.find((s) => s.slot === draft.start)?.maxHours ?? MAX_DURATION;
  return Math.max(minHoursOf(pkg), Math.min(draft.duration, limit));
}

/**
 * Error per langkah. Kunci = id elemen yang dituju tautan ringkasan error.
 * Langkah 1 selalu valid selama paket ada.
 */
export function validateStep(step, { draft, profile, user, today, now }) {
  const errors = {};
  if (step === 1 && !profile.packages.some((p) => p.id === draft.packageId)) {
    errors['booking-package'] = 'Pilih paket layanan.';
  }
  if (step === 2) {
    const date = parseISODate(draft.date);
    const bookable = date && (!today || date >= today) && profile.workDays.includes(date.getDay());
    if (!bookable) errors['booking-date'] = 'Pilih tanggal layanan.';
    const pkg = profile.packages.find((p) => p.id === draft.packageId);
    if (!bookableSlots({ draft, profile, pkg, now }).some((s) => s.slot === draft.start)) {
      errors['booking-time'] = 'Pilih jam mulai layanan.';
    }
  }
  if (step === 3) {
    if (!user?.phone) {
      const phone = normalizePhone(draft.phone);
      if (!phone) errors['booking-phone'] = 'Isi nomor HP aktif Anda.';
      else if (!PHONE_PATTERN.test(phone)) {
        errors['booking-phone'] = 'Nomor HP belum valid, contoh: 81234567890.';
      }
    }
    if (!selectedAddress(draft, user)) {
      errors['booking-address'] = 'Pilih atau tambahkan alamat lokasi layanan.';
    }
  }
  if (step === 4) {
    if (!findPaymentMethod(draft.paymentMethod)) {
      errors['booking-payment'] = 'Pilih metode pembayaran.';
    }
    if (!draft.agree) {
      errors['booking-agree'] = 'Centang persetujuan Syarat & Ketentuan untuk mengirim pesanan.';
    }
  }
  return errors;
}

/** Langkah pertama yang belum lengkap (1–4); 4 bila langkah 1–3 lengkap. */
export function firstIncompleteStep(context) {
  for (let step = 1; step <= 3; step += 1) {
    if (Object.keys(validateStep(step, context)).length) return step;
  }
  return 4;
}

/** Mode layanan untuk dikirim: datang ke lokasi pelanggan bila tersedia. */
export const serviceModeOf = (pkg) =>
  pkg?.serviceMode === 'at_provider' ? 'at_provider' : 'at_customer';

/** Area singkat lokasi (min. 3 karakter di backend): kota pengguna atau bagian akhir alamat. */
function areaOf(address, user) {
  if (address?.area?.trim().length >= 3) return address.area.trim().slice(0, 100);
  const fromAddress = address?.text
    ?.split(',')
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
    .at(-1);
  return (user?.city || fromAddress || 'Jawa Barat').slice(0, 100);
}

/**
 * Draf → body POST /bookings (djc-backend B1). `quantity` hanya untuk layanan per jam;
 * lokasi wajib bila penyedia datang ke lokasi pelanggan.
 */
export function draftToApiPayload({ draft, profile, user }) {
  const pkg = profile.packages.find((p) => p.id === draft.packageId);
  const slots = bookableSlots({ draft, profile, pkg });
  const mode = serviceModeOf(pkg);
  const address = selectedAddress(draft, user);
  const note = draft.note.trim();
  return {
    service_id: pkg.id,
    scheduled_date: draft.date,
    start_time: toApiTime(draft.start),
    service_mode: mode,
    ...(isHourly(pkg) ? { quantity: effectiveDuration(draft, pkg, slots) } : {}),
    ...(mode === 'at_customer'
      ? {
          location_area: areaOf(address, user),
          location_address: (address?.text ?? '').slice(0, 500),
          // Titik peta dari pop-up Tambah Alamat (drop pin), bila ada.
          ...(Number.isFinite(address?.lat) && Number.isFinite(address?.lng)
            ? { location_lat: address.lat, location_lng: address.lng }
            : {}),
        }
      : {}),
    ...(note ? { customer_note: note } : {}),
  };
}

/**
 * Pesanan dari respons POST /bookings → data pesanan lokal (bentuk SAMPLE_BOOKINGS) agar
 * pop-up sukses dan Pesanan Saya langsung menampilkannya.
 */
export function draftToBooking({ draft, profile, user }, created = {}) {
  const pkg = profile.packages.find((p) => p.id === draft.packageId);
  const hours = effectiveDuration(draft, pkg, bookableSlots({ draft, profile, pkg }));
  const address = selectedAddress(draft, user);
  return {
    id: created.id,
    code: created.code,
    providerId: profile.id,
    provider: providerSnapshot(profile),
    service: pkg.title,
    mode:
      serviceModeOf(pkg) === 'at_provider'
        ? 'Anda datang ke lokasi penyedia'
        : 'Penyedia datang ke lokasi Anda',
    date: draft.date,
    start: startHourOf(draft.start),
    hours,
    unitPrice: created.unit_price_snapshot ?? pkg.priceFrom,
    unit: pkg.priceUnit ?? 'layanan',
    quantity: created.quantity ?? (isHourly(pkg) ? hours : 1),
    note: draft.note.trim(),
    address: address?.text ?? '',
    customerPhone: user?.phone ?? `+62${normalizePhone(draft.phone)}`,
    autoCancelHours: RESPONSE_HOURS,
    // Pembayaran simulasi (dummy) yang dipilih di langkah 4.
    payment: findPaymentMethod(draft.paymentMethod)
      ? { method: findPaymentMethod(draft.paymentMethod).label, status: 'lunas-simulasi' }
      : null,
  };
}
