import { useCallback, useEffect, useSyncExternalStore } from 'react';
import {
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
} from '@/features/account/accountApi';

/**
 * Alamat tersimpan pelanggan dari backend (GET/POST/PATCH/DELETE /me/addresses), dipakai
 * Profil Saya dan langkah Detail Pesanan. Disimpan di satu cache per akun supaya fungsi
 * sinkron seperti `addressesFor(user)` (validasi & payload pesanan) membaca data yang sama
 * dengan komponen yang memakai `useAddressBook`. Selama alamat belum dimuat (atau backend
 * tidak bisa dihubungi, mis. akun demo), alamat bawaan akun (`user.addresses`) dipakai.
 */

export const ADDRESS_LABELS = ['Rumah', 'Kantor', 'Lainnya'];
export const ADDRESS_TEXT_MAX = 300;
export const ADDRESS_DETAIL_MAX = 120;
export const ADDRESS_LIMIT = 10;

const keyOf = (user) => user?.id ?? user?.email ?? null;
const EMPTY_ENTRY = { status: 'idle', list: [], error: null };

let entries = new Map();
const listeners = new Set();

function setEntry(key, entry) {
  entries = new Map(entries).set(key, entry);
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Urutan sama dengan backend: alamat utama dulu. */
const sortAddresses = (list) => [...list].sort((a, b) => Number(b.primary) - Number(a.primary));

/** Muat (ulang) alamat akun dari backend. Error disimpan di cache, tidak dilempar. */
export async function loadAddresses(user) {
  const key = keyOf(user);
  if (!key) return;
  const previous = entries.get(key) ?? EMPTY_ENTRY;
  setEntry(key, { ...previous, status: previous.status === 'ready' ? 'ready' : 'loading' });
  try {
    const list = await listAddresses();
    setEntry(key, { status: 'ready', list: sortAddresses(list), error: null });
  } catch (error) {
    setEntry(key, { ...previous, status: previous.status === 'ready' ? 'ready' : 'error', error });
  }
}

/** Alamat akun saat ini (sinkron). */
export function addressesFor(user) {
  if (!user) return [];
  const entry = entries.get(keyOf(user));
  return entry?.status === 'ready' ? entry.list : (user.addresses ?? []);
}

/** Simpan alamat baru lalu muat ulang daftar; mengembalikan alamat tersimpan. */
export async function addAddress(user, address) {
  const created = await createAddress(address);
  await loadAddresses(user);
  return created;
}

export async function editAddress(user, id, changes) {
  const updated = await updateAddress(id, changes);
  await loadAddresses(user);
  return updated;
}

export async function removeAddress(user, id) {
  await deleteAddress(id);
  await loadAddresses(user);
}

/**
 * Alamat akun untuk komponen: `{ status, addresses, error, reload }`. Memuat sekali per akun
 * saat pertama dipakai; `status` 'loading' | 'ready' | 'error'.
 */
export function useAddressBook(user) {
  const key = keyOf(user);
  const entry = useSyncExternalStore(subscribe, () => entries.get(key) ?? EMPTY_ENTRY);

  useEffect(() => {
    if (key && (entries.get(key) ?? EMPTY_ENTRY).status === 'idle') loadAddresses(user);
    // Muat ulang hanya saat akun berganti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => loadAddresses(user), [user]);
  return {
    status: entry.status === 'idle' ? 'loading' : entry.status,
    addresses: addressesFor(user),
    error: entry.error,
    reload,
  };
}

/** Untuk test: kosongkan cache. */
export function resetAddressBook() {
  entries = new Map();
  listeners.forEach((listener) => listener());
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
