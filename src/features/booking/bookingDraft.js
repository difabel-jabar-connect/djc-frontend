import { formatRupiah } from '@/lib/format';
import {
  MAX_DURATION,
  formatHourRange,
  SAMPLE_FULL_SLOTS,
  START_SLOTS,
  maxDurationFrom,
  parseISODate,
  startHourOf,
  toISODate,
} from './schedule';

/**
 * Alur Pesan Layanan 4 langkah (desain HTML pesan-layanan-1…5).
 * Draf disimpan di sessionStorage per penyedia agar tidak hilang saat halaman dimuat ulang
 * di tengah alur. TODO(API): kirim ke endpoint booking backend saat tersedia.
 */
export const BOOKING_STEPS = ['Pilih Layanan', 'Jadwal', 'Detail Pesanan', 'Kirim Pesanan'];

export const NOTE_MAX = 300;
export const DEFAULT_DURATION = 2;
export const DEFAULT_RADIUS_KM = 5;
export const RESPONSE_HOURS = 24;
export const PHONE_PATTERN = /^8\d{7,12}$/;

const storageKey = (providerId) => `djc.booking.${providerId}`;

/** "0812-3456 7890" / "+62 812…" → "8123456 7890" tanpa awalan 0/62/+62 & non-angka. */
export const normalizePhone = (value) =>
  String(value)
    .replace(/\D/g, '')
    .replace(/^(62|0)/, '');

export const isHourly = (pkg) => pkg?.priceUnit === 'jam';

export const priceLabel = (pkg) =>
  `${formatRupiah(pkg.priceFrom)}${pkg.priceUnit ? `/${pkg.priceUnit}` : ''}`;

/** "09.00–11.00 WIB (2 jam)" atau "09.00 WIB" untuk paket non-per-jam. */
export function timeLabel(start, hours, hourly) {
  if (!start) return '';
  return hourly ? `${formatHourRange(start, hours)} WIB (${hours} jam)` : `${start} WIB`;
}

export function createDraft({ profile, user, packageId, date }) {
  const addresses = user?.addresses ?? [];
  return {
    packageId: profile.packages.find((p) => p.id === packageId)?.id ?? profile.packages[0]?.id,
    date: date ? toISODate(date) : '',
    start: '',
    duration: DEFAULT_DURATION,
    addressId: (addresses.find((a) => a.primary) ?? addresses[0])?.id ?? 'lain',
    customAddress: '',
    note: '',
    phone: '',
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

/** Alamat terpilih sebagai objek tampilan, atau null bila belum diisi. */
export function selectedAddress(draft, user) {
  if (draft.addressId === 'lain') {
    const text = draft.customAddress.trim();
    return text ? { id: 'lain', label: 'Alamat lain', text } : null;
  }
  return (user?.addresses ?? []).find((a) => a.id === draft.addressId) ?? null;
}

/** Durasi efektif: paket per jam memakai durasi terpilih (dibatasi slot), selain itu 1. */
export function effectiveDuration(draft, pkg) {
  if (!isHourly(pkg)) return 1;
  return Math.min(draft.duration, maxDurationFrom(draft.start, SAMPLE_FULL_SLOTS), MAX_DURATION);
}

/**
 * Error per langkah. Kunci = id elemen yang dituju tautan ringkasan error.
 * Langkah 1 selalu valid selama paket ada.
 */
export function validateStep(step, { draft, profile, user, today }) {
  const errors = {};
  if (step === 1 && !profile.packages.some((p) => p.id === draft.packageId)) {
    errors['booking-package'] = 'Pilih paket layanan.';
  }
  if (step === 2) {
    const date = parseISODate(draft.date);
    const bookable = date && (!today || date >= today) && profile.workDays.includes(date.getDay());
    if (!bookable) errors['booking-date'] = 'Pilih tanggal layanan.';
    if (!START_SLOTS.includes(draft.start) || SAMPLE_FULL_SLOTS.includes(draft.start)) {
      errors['booking-time'] = 'Pilih jam mulai layanan.';
    }
  }
  if (step === 3) {
    if (!user?.phone) {
      const phone = normalizePhone(draft.phone);
      if (!phone)
        errors['booking-phone'] = 'Isi nomor WhatsApp agar penyedia bisa menghubungi Anda.';
      else if (!PHONE_PATTERN.test(phone)) {
        errors['booking-phone'] = 'Nomor WhatsApp belum valid, contoh: 81234567890.';
      }
    }
    if (!selectedAddress(draft, user)) {
      errors['booking-address'] = 'Isi alamat lengkap lokasi layanan.';
    }
  }
  if (step === 4 && !draft.agree) {
    errors['booking-agree'] = 'Centang persetujuan Syarat & Ketentuan untuk mengirim pesanan.';
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

/** Draf → data pesanan untuk CustomerContext.createBooking (bentuk sama dengan SAMPLE_BOOKINGS). */
export function draftToBooking({ draft, profile, user }) {
  const pkg = profile.packages.find((p) => p.id === draft.packageId);
  const hours = effectiveDuration(draft, pkg);
  const address = selectedAddress(draft, user);
  return {
    providerId: profile.id,
    service: pkg.title,
    mode: 'Penyedia datang ke lokasi Anda',
    date: draft.date,
    start: startHourOf(draft.start),
    hours,
    unitPrice: pkg.priceFrom,
    unit: pkg.priceUnit ?? 'layanan',
    quantity: isHourly(pkg) ? hours : 1,
    note: draft.note.trim(),
    address: address.text,
    customerPhone: user?.phone ?? `+62${normalizePhone(draft.phone)}`,
    autoCancelHours: RESPONSE_HOURS,
  };
}
