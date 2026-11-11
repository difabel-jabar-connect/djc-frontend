import { getSampleProvider } from '@/features/providers/sampleProviders';

/**
 * Data penyedia untuk kartu/detail pesanan. Penyedia contoh dicari dari data lokal; penyedia
 * dari backend (id UUID) memakai salinan `booking.provider` yang disimpan saat pesanan dibuat.
 * Pesanan lama tanpa salinan tetap tampil dengan nama umum, bukan membuat halaman error.
 */
export function bookingProvider(booking) {
  const sample = getSampleProvider(booking?.providerId);
  if (sample) return sample;
  const saved = booking?.provider ?? {};
  const name = saved.name || 'Penyedia layanan';
  return {
    id: booking?.providerId,
    name,
    initials:
      saved.initials ||
      name
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join(''),
    avatarColor: saved.avatarColor || '#0b3c6e',
    city: saved.city ?? '',
    rating: saved.rating ?? 0,
    reviewCount: saved.reviewCount ?? 0,
    category: saved.category ?? '',
    categorySlug: saved.categorySlug ?? '',
  };
}

/** Salinan ringkas profil penyedia yang ikut disimpan di pesanan baru. */
export const providerSnapshot = (profile) => ({
  name: profile.name,
  initials: profile.initials,
  avatarColor: profile.avatarColor,
  city: profile.city,
  rating: profile.rating,
  reviewCount: profile.reviewCount,
  category: profile.category,
  categorySlug: profile.categorySlug,
});
