import { cityLabel, groupServicesByProvider, hoursLabel, toProfile } from './providerAdapters';

const provider = (id, overrides = {}) => ({
  id,
  display_name: 'Deni Setiawan',
  photo_url: null,
  city: 'Kota Bekasi',
  district: 'Bekasi Selatan',
  public_lat: -6.24,
  public_lng: 106.98,
  rating_avg: 5,
  rating_count: 1,
  ...overrides,
});

const service = (id, providerId, overrides = {}) => ({
  id,
  title: 'Servis elektronik rumah tangga',
  description: 'Servis TV dan kipas angin.',
  pricing_type: 'starting_from',
  price_amount: 75000,
  min_hours: null,
  duration_estimate_min: 90,
  service_mode: 'at_customer',
  category: { id: 'c1', name: 'Servis Elektronik', slug: 'servis-elektronik' },
  provider: provider(providerId),
  ...overrides,
});

describe('cityLabel', () => {
  it('menyederhanakan nama kota/kabupaten dari backend', () => {
    expect(cityLabel('Kota Bandung')).toBe('Bandung');
    expect(cityLabel('Kabupaten Bogor')).toBe('Kab. Bogor');
    expect(cityLabel('Depok')).toBe('Depok');
  });
});

describe('groupServicesByProvider', () => {
  it('satu kartu per penyedia, harga = layanan termurah, urutan dipertahankan', () => {
    const cards = groupServicesByProvider([
      service('s1', 'p1'),
      service('s2', 'p2', { provider: provider('p2', { display_name: 'Siti Rahmawati' }) }),
      service('s3', 'p1', { pricing_type: 'hourly', price_amount: 50000 }),
    ]);
    expect(cards.map((card) => card.id)).toEqual(['p1', 'p2']);
    expect(cards[0]).toMatchObject({
      name: 'Deni Setiawan',
      initials: 'DS',
      city: 'Bekasi',
      cityRaw: 'Kota Bekasi',
      address: 'Bekasi Selatan, Bekasi',
      categorySlug: 'servis-elektronik',
      category: 'Servis Elektronik',
      rating: 5,
      reviewCount: 1,
      lat: -6.24,
      lng: 106.98,
      priceFrom: 50000,
      priceUnit: 'jam',
      serviceIds: ['s1', 's3'],
    });
  });
});

describe('toProfile', () => {
  const data = {
    ...provider('p1'),
    bio: 'Alumni pelatihan servis elektronik.',
    communication_prefs: ['chat'],
    service_radius_km: 10,
    skills: [],
    services: [
      {
        id: 's1',
        title: 'Servis elektronik',
        category: { name: 'Servis Elektronik', slug: 'servis-elektronik' },
        pricing_type: 'hourly',
        price_amount: 60000,
        min_hours: 2,
        duration_estimate_min: 120,
        service_mode: 'both',
      },
    ],
    availability: [
      { day_of_week: 1, start_time: '08:00', end_time: '12:00' },
      { day_of_week: 3, start_time: '13:00', end_time: '17:00' },
    ],
    portfolio: [],
  };

  it('memetakan paket, hari kerja, dan jam layanan dari jadwal', () => {
    const profile = toProfile(data);
    expect(profile).toMatchObject({
      id: 'p1',
      name: 'Deni Setiawan',
      city: 'Bekasi',
      about: ['Alumni pelatihan servis elektronik.'],
      priceFrom: 60000,
      workDays: [1, 3],
      hours: '08.00 – 17.00 WIB',
      reviews: [],
    });
    expect(profile.packages).toEqual([
      expect.objectContaining({
        id: 's1',
        priceUnit: 'jam',
        minHours: 2,
        serviceMode: 'both',
        estimate: 'Estimasi 2 jam',
      }),
    ]);
  });

  it('tanpa jadwal → label jam menyatakan belum ada jadwal', () => {
    expect(hoursLabel([])).toBe('Belum ada jadwal');
  });
});
