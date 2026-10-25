import {
  buildMonthGrid,
  calculateServiceFee,
  formatSlotRange,
  parseISODate,
  toggleSlot,
  upcomingDays,
} from './schedule';

const FULL = ['13.00', '15.00'];

describe('toggleSlot', () => {
  it('memilih, memperpanjang, dan memperpendek rentang berurutan', () => {
    let s = toggleSlot([], '09.00', undefined, FULL);
    expect(s).toEqual(['09.00']);
    s = toggleSlot(s, '10.00', undefined, FULL);
    expect(s).toEqual(['09.00', '10.00']);
    s = toggleSlot(s, '08.00', undefined, FULL);
    expect(s).toEqual(['08.00', '09.00', '10.00']);
    s = toggleSlot(s, '10.00', undefined, FULL);
    expect(s).toEqual(['08.00', '09.00']);
  });

  it('klik slot tidak bersebelahan memulai rentang baru; slot penuh diabaikan', () => {
    expect(toggleSlot(['09.00'], '16.00', undefined, FULL)).toEqual(['16.00']);
    expect(toggleSlot(['14.00'], '13.00', undefined, FULL)).toEqual(['14.00']);
  });

  it('tidak menyambung melewati jeda istirahat 12.00', () => {
    expect(toggleSlot(['11.00'], '13.00')).toEqual(['13.00']);
  });
});

describe('format & harga', () => {
  it('memformat rentang jam', () => {
    expect(formatSlotRange(['09.00', '10.00'])).toBe('09.00–11.00 (2 jam)');
    expect(formatSlotRange([])).toBe('');
  });

  it('tarif per jam dikali durasi; satuan lain sekali', () => {
    expect(calculateServiceFee({ priceFrom: 50000, priceUnit: 'jam' }, 2)).toBe(100000);
    expect(calculateServiceFee({ priceFrom: 50000, priceUnit: 'jam' }, 0)).toBe(50000);
    expect(calculateServiceFee({ priceFrom: 30000, priceUnit: 'item' }, 3)).toBe(30000);
    expect(calculateServiceFee(undefined, 2)).toBe(0);
  });
});

describe('tanggal', () => {
  it('parseISODate menolak format/tanggal tidak valid', () => {
    expect(parseISODate('2026-10-20')).toEqual(new Date(2026, 9, 20));
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('kemarin')).toBeNull();
  });

  it('buildMonthGrid menaruh Senin di kolom pertama', () => {
    const grid = buildMonthGrid(2026, 9); // Oktober 2026, tanggal 1 = Kamis
    expect(grid.slice(0, 4)).toEqual([null, null, null, new Date(2026, 9, 1)]);
    expect(grid.filter(Boolean)).toHaveLength(31);
  });

  it('upcomingDays menandai hari libur', () => {
    const days = upcomingDays(new Date(2026, 9, 19), [1, 2, 3, 4, 5, 6]);
    expect(days.map((d) => `${d.weekday} ${d.label} ${d.available}`)).toEqual([
      'Sen 19 Okt true',
      'Sel 20 Okt true',
      'Rab 21 Okt true',
      'Kam 22 Okt true',
      'Jum 23 Okt true',
      'Sab 24 Okt true',
      'Min 25 Okt false',
    ]);
  });
});
