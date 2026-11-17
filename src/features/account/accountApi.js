import { api } from '@/lib/api/client';

/**
 * Akun Saya (djc-backend docs/api-contract.md bagian 4a). Respons data diri berisi
 * `{ user }` dengan bentuk yang sama dengan GET /auth/me.
 */

/** PATCH /me — ubah nama dan/atau nomor HP (+62…). */
export async function updateAccount({ name, phone }) {
  const res = await api.patch('/me', { name, phone });
  return res?.data?.user;
}

/** PUT /me/password — 409 PASSWORD_NOT_SET untuk akun Google tanpa kata sandi. */
export async function changePassword({ currentPassword, newPassword }) {
  await api.put('/me/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
}

/** PUT /me/photo — `image` berupa data URI (FileReader.readAsDataURL), maks 5 MB. */
export async function uploadPhoto(image) {
  const res = await api.put('/me/photo', { image });
  return res?.data?.user;
}

/** DELETE /me/photo — kembali ke inisial. */
export async function deletePhoto() {
  const res = await api.delete('/me/photo');
  return res?.data?.user;
}

/** Alamat dari API → bentuk yang dipakai UI (Pesan Layanan & Profil Saya). */
export const fromApiAddress = (row) => ({
  id: row.id,
  label: row.label,
  text: row.address,
  detail: row.detail ?? '',
  area: row.area ?? '',
  lat: row.lat,
  lng: row.lng,
  primary: Boolean(row.is_primary),
});

const toApiAddress = (address) => {
  const body = {};
  if (address.label !== undefined) body.label = address.label;
  if (address.text !== undefined) body.address = address.text;
  if (address.detail !== undefined) body.detail = address.detail;
  if (address.area !== undefined) body.area = address.area;
  if (address.lat !== undefined) body.lat = address.lat;
  if (address.lng !== undefined) body.lng = address.lng;
  if (address.primary !== undefined) body.is_primary = address.primary;
  return body;
};

export async function listAddresses({ signal } = {}) {
  const res = await api.get('/me/addresses', { signal });
  return (res?.data ?? []).map(fromApiAddress);
}

export async function createAddress(address) {
  const res = await api.post('/me/addresses', toApiAddress(address));
  return fromApiAddress(res.data);
}

export async function updateAddress(id, changes) {
  const res = await api.patch(`/me/addresses/${encodeURIComponent(id)}`, toApiAddress(changes));
  return fromApiAddress(res.data);
}

export async function deleteAddress(id) {
  await api.delete(`/me/addresses/${encodeURIComponent(id)}`);
}
