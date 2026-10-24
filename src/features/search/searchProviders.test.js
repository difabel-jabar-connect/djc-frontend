import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import { filterProviders, paginate, readCriteria } from './searchProviders';

const criteria = (overrides = {}) => ({ ...readCriteria(new URLSearchParams()), ...overrides });
const names = (list) => list.map((p) => p.name);

describe('readCriteria', () => {
  it('membaca query string dan memberi nilai bawaan', () => {
    const c = readCriteria(new URLSearchParams('q=%20jahit%20&kategori=jahit&hal=abc'));
    expect(c).toMatchObject({ q: 'jahit', kategori: 'jahit', urut: 'relevan', page: 1 });
  });
});

describe('filterProviders', () => {
  it('tanpa filter mengembalikan semua penyedia', () => {
    expect(filterProviders(SAMPLE_PROVIDERS, criteria())).toHaveLength(SAMPLE_PROVIDERS.length);
  });

  it('mencari kata kunci di nama, kategori, kota, dan deskripsi (tanpa peka huruf)', () => {
    expect(names(filterProviders(SAMPLE_PROVIDERS, criteria({ q: 'PIJAT bogor' })))).toEqual([
      'Fahri Hidayat',
    ]);
    expect(names(filterProviders(SAMPLE_PROVIDERS, criteria({ q: 'logo' })))).toEqual([
      'Agus Setiawan',
    ]);
  });

  it('menggabungkan filter kategori, lokasi, rating, harga, dan hari', () => {
    expect(
      names(filterProviders(SAMPLE_PROVIDERS, criteria({ lokasi: 'Bandung', rating: '4.5' }))),
    ).toEqual(['Rizki Maulana', 'Agus Setiawan', 'Rina Agustina']);
    expect(names(filterProviders(SAMPLE_PROVIDERS, criteria({ harga: 'lt50' })))).toEqual([
      'Lina Kurnia',
      'Siti Nurjanah',
      'Rina Agustina',
    ]);
    expect(
      names(
        filterProviders(SAMPLE_PROVIDERS, criteria({ hari: 'akhir-pekan', kategori: 'terapi' })),
      ),
    ).toEqual(['Fahri Hidayat']);
  });

  it('mengurutkan berdasarkan rating dan harga', () => {
    expect(filterProviders(SAMPLE_PROVIDERS, criteria({ urut: 'rating' }))[0].name).toBe(
      'Lina Kurnia',
    );
    expect(
      filterProviders(SAMPLE_PROVIDERS, criteria({ urut: 'harga' })).map((p) => p.priceFrom),
    ).toEqual([25000, 25000, 30000, 50000, 60000, 75000, 100000]);
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
