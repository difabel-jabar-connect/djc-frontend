import { api } from '@/lib/api/client';

/**
 * Memberikan ulasan dan rating untuk pesanan yang sudah berstatus 'completed' (R1).
 * Hanya dapat dipanggil satu kali oleh customer pemilik pesanan.
 *
 * @param {string} bookingId - UUID booking
 * @param {Object} payload
 * @param {number} payload.rating - Integer 1 hingga 5
 * @param {string} [payload.comment] - Komentar ulasan (opsional, maks. 500 karakter)
 */
export async function submitReview(bookingId, { rating, comment }) {
  const res = await api.post(`/bookings/${bookingId}/reviews`, {
    rating: Number(rating),
    comment: comment?.trim() || undefined,
  });
  return res?.data;
}
