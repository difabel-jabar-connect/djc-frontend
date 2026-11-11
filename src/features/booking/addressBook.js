/**
 * Alamat layanan milik pelanggan. Alamat bawaan akun (`user.addresses`, mis. akun demo)
 * digabung dengan alamat yang ditambahkan lewat pop-up "Tambah Alamat", yang sementara
 * disimpan di localStorage per akun. TODO(API): simpan ke profil pengguna di backend.
 */
const storageKey = (user) => `djc.alamat.${user?.id ?? user?.email ?? 'tamu'}`;

export const ADDRESS_LABELS = ['Rumah', 'Kantor', 'Lainnya'];
export const ADDRESS_TEXT_MAX = 300;
export const ADDRESS_DETAIL_MAX = 120;

function readSaved(user) {
  try {
    const list = JSON.parse(localStorage.getItem(storageKey(user)));
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeSaved(user, list) {
  try {
    localStorage.setItem(storageKey(user), JSON.stringify(list));
  } catch {
    // Penyimpanan diblokir: alamat tetap terpilih selama halaman tidak dimuat ulang.
  }
}

/** Semua alamat pengguna; tepat satu yang `primary` bila ada alamat. */
export function addressesFor(user) {
  if (!user) return [];
  const saved = readSaved(user);
  const savedPrimary = saved.some((a) => a.primary);
  const builtIn = (user.addresses ?? []).map((a) => (savedPrimary ? { ...a, primary: false } : a));
  return [...saved, ...builtIn];
}

/** Simpan alamat baru, kembalikan alamat tersimpan (dengan id). */
export function addAddress(user, address) {
  const saved = readSaved(user);
  const isFirst = !saved.length && !(user?.addresses ?? []).length;
  const entry = {
    ...address,
    id: `alamat-${Date.now().toString(36)}`,
    primary: Boolean(address.primary) || isFirst,
  };
  const others = entry.primary ? saved.map((a) => ({ ...a, primary: false })) : saved;
  writeSaved(user, [entry, ...others]);
  return entry;
}

/** Jarak garis lurus (km, 1 desimal) antara dua titik { lat, lng }. */
export function distanceKm(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return null;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)) * 10) / 10;
}

/** Teks alamat lengkap untuk ringkasan & backend: alamat + detail/patokan. */
export const addressLine = (address) =>
  [address.text, address.detail]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' · ');
