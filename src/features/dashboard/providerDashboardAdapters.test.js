import { describe, expect, it } from 'vitest';
import {
  buildCompletePayload,
  computeProviderMetrics,
  fromApiProviderBooking,
} from './providerDashboardAdapters';

describe('providerDashboardAdapters', () => {
  it('memetakan booking API backend ke baris tabel dashboard penyedia', () => {
    const mapped = fromApiProviderBooking({
      id: 'b-1',
      code: 'DJC-20261125-0001',
      status: 'requested',
      service: { id: 's-1', title: 'Servis Kipas Angin' },
      provider: { id: 'p-1', display_name: 'Deni Setiawan', city: 'Kota Bekasi' },
      customer: { name: 'Budi S.', phone: null },
      scheduled_date: '2026-11-25',
      start_time: '10:00',
      service_mode: 'at_customer',
      location: { area: 'Bekasi Selatan', address: null },
      customer_note: 'Kipas tidak berputar',
      pricing_type_snapshot: 'starting_from',
      unit_price_snapshot: 50000,
      quantity: 1,
      estimated_total: 50000,
      actual_quantity: null,
      final_total: null,
      created_at: '2026-11-25T02:00:00.000Z',
    });

    expect(mapped.status).toBe('requested');
    expect(mapped.customer).toBe('Budi S.');
    expect(mapped.city).toBe('Bekasi Selatan');
    expect(mapped.start).toBe(10);
    expect(mapped.pricingType).toBe('starting_from');
    expect(mapped.unitPrice).toBe(50000);
  });

  it('memvalidasi payload complete sesuai pricing_type (hourly, starting_from, fixed)', () => {
    expect(
      buildCompletePayload({ pricingType: 'hourly', unitPrice: 60000 }, { actualQuantity: 2.5 }),
    ).toEqual({ payload: { actual_quantity: 2.5 } });

    expect(
      buildCompletePayload({ pricingType: 'hourly', unitPrice: 60000 }, { actualQuantity: 1.3 })
        .error,
    ).toMatch(/kelipatan 0,5/i);

    expect(
      buildCompletePayload(
        { pricingType: 'starting_from', unitPrice: 50000 },
        { finalTotal: 40000 },
      ).error,
    ).toMatch(/minimal/i);

    expect(
      buildCompletePayload(
        { pricingType: 'starting_from', unitPrice: 50000 },
        { finalTotal: 75000 },
      ),
    ).toEqual({ payload: { final_total: 75000 } });

    expect(buildCompletePayload({ pricingType: 'fixed', unitPrice: 80000 })).toEqual({
      payload: {},
    });
  });

  it('menghitung metrik bulan ini, tren 7 hari, dan kelengkapan profil dari data live', () => {
    const today = new Date(2026, 10, 25);
    const orders = [
      fromApiProviderBooking({
        id: '1',
        code: 'DJC-1',
        status: 'completed',
        scheduled_date: '2026-11-25',
        start_time: '09:00',
        estimated_total: 100000,
        final_total: 120000,
      }),
      fromApiProviderBooking({
        id: '2',
        code: 'DJC-2',
        status: 'requested',
        scheduled_date: '2026-11-24',
        start_time: '11:00',
        estimated_total: 50000,
      }),
      fromApiProviderBooking({
        id: '3',
        code: 'DJC-3',
        status: 'rejected',
        scheduled_date: '2026-11-25',
        start_time: '13:00',
        estimated_total: 90000,
      }),
    ];
    const metrics = computeProviderMetrics({
      orders,
      services: [
        { id: 's1', is_active: true },
        { id: 's2', is_active: false },
      ],
      profile: {
        display_name: 'Deni',
        city: 'Bekasi',
        address_detail: 'Jl. Ahmad Yani',
        phone: '+6281234567890',
        photo_url: null,
      },
      portfolio: [{ id: 'pf1' }],
      today,
    });

    expect(metrics.monthOrderCount).toBe(2);
    expect(metrics.monthIncome).toBe(120000);
    expect(metrics.activeServices).toBe(1);
    expect(metrics.totalServices).toBe(2);
    expect(metrics.last7Days).toEqual([0, 0, 0, 0, 0, 1, 1]);
    expect(metrics.completeness).toBe(80);
  });
});
