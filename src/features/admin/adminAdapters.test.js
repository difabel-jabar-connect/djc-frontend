import { describe, expect, it } from 'vitest';
import {
  fromApiAdminCategory,
  fromApiAdminProvider,
  fromApiAdminReview,
  fromApiAdminUser,
} from './adminAdapters';

describe('adminAdapters', () => {
  it('memetakan provider API ke bentuk antrean verifikasi termasuk status lokasi', () => {
    const mapped = fromApiAdminProvider({
      id: 'p-1',
      display_name: 'Yusuf Hidayat',
      alumni_reg_no: 'AL-2024-006',
      city: 'Kota Cimahi',
      district: 'Cimahi Utara',
      has_location: true,
      verification_status: 'pending',
      verified_at: null,
      created_at: '2026-10-18T08:00:00.000Z',
      user: {
        id: 'u-6',
        name: 'Yusuf Hidayat',
        email: 'yusuf@djc.test',
        phone: '+6281234567890',
        status: 'active',
      },
    });

    expect(mapped.status).toBe('menunggu');
    expect(mapped.checklist.location).toBe(true);
    expect(mapped.checklist.alumni).toBe(true);
    expect(mapped.email).toBe('yusuf@djc.test');
    expect(mapped.decision).toBeNull();
  });

  it('memetakan kategori, ulasan tersembunyi, dan akun pengguna dari API backend', () => {
    const cat = fromApiAdminCategory({
      id: 'c-1',
      name: 'Kebersihan',
      slug: 'kebersihan',
      icon: 'sparkle',
      sort_order: 1,
      is_active: false,
      services_count: 3,
    });
    expect(cat).toMatchObject({ name: 'Kebersihan', services: 3, active: false, icon: 'sparkle' });

    const rev = fromApiAdminReview({
      id: 'r-1',
      booking_id: 'abcdef12-3456-4789-8abc-def012345678',
      rating: 2,
      comment: 'Kurang rapi',
      is_hidden: true,
      hidden_reason: 'Bahasa kasar',
      created_at: '2026-10-20T10:00:00.000Z',
      provider: { id: 'p-1', display_name: 'Deni Setiawan' },
      customer: { id: 'u-1', name: 'Budi Santoso' },
    });
    expect(rev.status).toBe('disembunyikan');
    expect(rev.bookingCode).toBe('BK-ABCDEF12');
    expect(rev.moderation.reason).toBe('Bahasa kasar');

    const user = fromApiAdminUser({
      id: 'u-1',
      role: 'customer',
      name: 'Budi Santoso',
      email: 'budi@djc.test',
      phone: '+6281234567890',
      status: 'suspended',
      created_at: '2026-10-01T00:00:00.000Z',
    });
    expect(user.role).toBe('pengguna');
    expect(user.status).toBe('disuspensi');
    expect(user.suspension).not.toBeNull();
  });
});
