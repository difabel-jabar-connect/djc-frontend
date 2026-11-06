import { filterByCity, paginate, readCriteria, toApiCriteria } from './searchProviders';

const criteria = (overrides = {}) => ({ ...readCriteria(new URLSearchParams()), ...overrides });

describe('readCriteria', () => {
  it('membaca query string dan memberi nilai bawaan', () => {
    const c = readCriteria(new URLSearchParams('q=%20jahit%20&kategori=jahit&hal=abc'));
    expect(c).toMatchObject({ q: 'jahit', kategori: 'jahit', urut: 'relevan', page: 1 });
  });
});

describe('toApiCriteria', () => {
  it('tanpa filter hanya mengirim urutan bawaan', () => {
    expect(toApiCriteria(criteria())).toEqual({
      q: undefined,
      category: undefined,
      min_rating: undefined,
      min_price: undefined,
      max_price: undefined,
      day_of_week: undefined,
      sort: 'newest',
    });
  });

  it('memetakan kata kunci, kategori, rating, harga, hari, dan urutan ke parameter backend', () => {
    expect(
      toApiCriteria(
        criteria({
          q: 'servis tv',
          kategori: 'servis-elektronik',
          rating: '4.5',
          harga: '50-100',
          hari: '6',
          urut: 'harga',
        }),
      ),
    ).toEqual({
      q: 'servis tv',
      category: 'servis-elektronik',
      min_rating: 4.5,
      min_price: 50000,
      max_price: 100000,
      day_of_week: '6',
      sort: 'price_asc',
    });
    expect(toApiCriteria(criteria({ harga: 'lt50', urut: 'rating' }))).toMatchObject({
      min_price: undefined,
      max_price: 49999,
      sort: 'rating_desc',
    });
  });

  it('mengabaikan nilai yang tidak dikenal (mis. tautan lama ?hari=kerja)', () => {
    expect(
      toApiCriteria(criteria({ hari: 'kerja', kategori: 'tidak-ada', urut: 'terdekat' })),
    ).toMatchObject({ day_of_week: undefined, category: undefined, sort: 'newest' });
  });
});

describe('filterByCity', () => {
  const providers = [
    { id: 'a', city: 'Bandung', cityRaw: 'Kota Bandung' },
    { id: 'b', city: 'Kab. Bandung', cityRaw: 'Kabupaten Bandung' },
    { id: 'c', city: 'Bekasi', cityRaw: 'Kota Bekasi' },
  ];

  it('mencocokkan nama dasar kota (kota & kabupaten), tanpa filter = semua', () => {
    expect(filterByCity(providers, 'Bandung').map((p) => p.id)).toEqual(['a', 'b']);
    expect(filterByCity(providers, 'Bekasi').map((p) => p.id)).toEqual(['c']);
    expect(filterByCity(providers, '')).toHaveLength(3);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 14 }, (_, i) => i + 1);

  it('memotong per halaman dan menghitung rentang', () => {
    expect(paginate(items, 3)).toEqual({
      items: [13, 14],
      page: 3,
      totalPages: 3,
      from: 13,
      to: 14,
      total: 14,
    });
  });

  it('menjepit halaman di luar jangkauan & menangani hasil kosong', () => {
    expect(paginate(items, 99).page).toBe(3);
    expect(paginate([], 1)).toMatchObject({ page: 1, totalPages: 1, from: 0, to: 0, total: 0 });
  });
});
