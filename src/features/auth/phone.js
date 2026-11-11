/** Nomor seluler Indonesia tanpa 0/+62 di depan: 8xx, total 9–13 digit. */
export const PHONE_PATTERN = /^8\d{8,12}$/;

/** Hapus 0 / 62 / +62 di depan dan karakter non-angka. */
export const normalizePhone = (value) => value.replace(/\D/g, '').replace(/^(62|0)/, '');

/** Format yang diterima backend: +62 diikuti nomor tanpa 0 di depan. */
export const toApiPhone = (value) => `+62${normalizePhone(value)}`;
