import { fromApiBooking, STATUS_FROM_API, toWibStamp } from './bookingAdapters';

const baseRow = (overrides = {}) => ({
  id: '22222222-2222-4222-8222-222222222202',
  code: 'DJC-0002',
  status: 'accepted',
  service: { id: '33333333-3333-4333-8333-333333333301', title: 'Permak celana' },
  provider: {
    id: '44444444-4444-4444-8444-444444444401',
    display_name: 'Siti Rahmawati',
    city: 'Kota Bandung',
    district: 'Coblong',
    phone: '+6281234567891',
    address_detail: 'Jl. Dago No. 10, Coblong, Kota Bandung',
  },
  customer: { name: 'Ani Wijaya', phone: '+6281111111111' },
  scheduled_date: '2026-11-28',
  start_time: '10:30',
  service_mode: 'at_provider',
  location: { area: null, address: null, lat: null, lng: null },
  customer_note: 'Potong 3 cm.',
  pricing_type_snapshot: 'fixed',
  unit_price_snapshot: 35000,
  quantity: 1,
  estimated_total: 35000,
  actual_quantity: null,
  final_total: null,
  cancelled_by: null,
  status_reason: null,
  can_review: false,
  created_at: '2026-11-25T03:00:00.000Z',
  ...overrides,
});

describe('bookingAdapters', () => {
  it('memetakan seluruh 6 status backend ke status UI', () => {
    expect(STATUS_FROM_API).toEqual({
      requested: 'menunggu',
      accepted: 'diterima',
      in_progress: 'berjalan',
      completed: 'selesai',
      cancelled: 'dibatalkan',
      rejected: 'ditolak',
    });
  });

  it('mengubah stempel UTC backend menjadi WIB (UTC+7)', () => {
    expect(toWibStamp('2026-11-25T03:15:00.000Z')).toBe('2026-11-25T10:15');
  });

  it('membuka kontak (telepon & alamat) hanya saat backend mengirimnya (accepted/in_progress)', () => {
    const accepted = fromApiBooking(baseRow());
    expect(accepted.status).toBe('diterima');
    expect(accepted.contact).toEqual({
      phone: '+6281234567891',
      address: 'Jl. Dago No. 10, Coblong, Kota Bandung',
    });
    expect(accepted.startTime).toBe('10:30');
    expect(accepted.provider.city).toBe('Bandung');

    const requested = fromApiBooking(
      baseRow({
        status: 'requested',
        provider: {
          ...baseRow().provider,
          phone: null,
          address_detail: null,
        },
      }),
      { nowMs: new Date('2026-11-25T09:00:00.000Z').getTime() },
    );
    expect(requested.status).toBe('menunggu');
    expect(requested.contact).toBeNull();
    expect(requested.autoCancelHours).toBe(18);
  });

  it('memetakan status selesai, can_review, final_total, dan riwayat lengkap', () => {
    const completed = fromApiBooking(
      baseRow({
        status: 'completed',
        can_review: true,
        final_total: 120000,
        provider: { ...baseRow().provider, phone: null, address_detail: null },
        history: [
          {
            from_status: null,
            to_status: 'requested',
            changed_by_role: 'customer',
            reason: null,
            created_at: '2026-11-20T01:00:00.000Z',
          },
          {
            from_status: 'in_progress',
            to_status: 'completed',
            changed_by_role: 'provider',
            reason: null,
            created_at: '2026-11-21T04:30:00.000Z',
          },
        ],
      }),
    );

    expect(completed.reviewed).toBe(false);
    expect(completed.canReview).toBe(true);
    expect(completed.finalTotal).toBe(120000);
    expect(completed.contact).toBeNull();
    expect(completed.hasFullHistory).toBe(true);
    expect(completed.history).toEqual([
      { status: 'menunggu', by: 'Anda', at: '2026-11-20T08:00', reason: null },
      { status: 'selesai', by: 'Penyedia', at: '2026-11-21T11:30', reason: null },
    ]);
  });
});
