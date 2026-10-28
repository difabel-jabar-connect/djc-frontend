import { REGIONS, SAMPLE_ALUMNI, buildMapProviders, densityLevel } from './pengelolaData';
import { buildPdf, formatPeriod, inPeriod, sameCity, slugFile, toCsv } from './pengelolaFormat';

describe('pengelolaFormat', () => {
  it('formatPeriod meringkas bulan & tahun yang sama', () => {
    expect(formatPeriod('2026-09-01', '2026-09-30')).toBe('1 – 30 Sep 2026');
    expect(formatPeriod('2026-01-01', '2026-10-31')).toBe('1 Jan – 31 Okt 2026');
    expect(formatPeriod('2025-12-01', '2026-01-31')).toBe('1 Des 2025 – 31 Jan 2026');
  });

  it('inPeriod memakai tanggal WIB', () => {
    expect(inPeriod('2026-10-31T23:30:00+07:00', '2026-10-01', '2026-10-31')).toBe(true);
    expect(inPeriod('2026-11-01T00:30:00+07:00', '2026-10-01', '2026-10-31')).toBe(false);
  });

  it('sameCity mencocokkan "Kota Bandung" dengan "Bandung"', () => {
    expect(sameCity('Kota Bandung', 'Bandung')).toBe(true);
    expect(sameCity('Kab. Bogor', 'Kota Bogor')).toBe(true);
    expect(sameCity('Kota Depok', 'Bandung')).toBe(false);
  });

  it('toCsv memberi tanda kutip pada sel berisi koma', () => {
    expect(toCsv(['A', 'B'], [['x, y', 'z']]).slice(1)).toBe('A,B\r\n"x, y",z\r\n');
  });

  it('buildPdf menghasilkan PDF valid berisi judul', () => {
    const pdf = buildPdf('Data Alumni', ['Rizki Maulana · 4,9']);
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('(Data Alumni) Tj');
    expect(pdf).toContain('(Rizki Maulana - 4,9) Tj');
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('slugFile', () => {
    expect(slugFile('Data Pesanan 1 – 30 Sep 2026')).toBe('data-pesanan-1-30-sep-2026');
  });
});

describe('pengelolaData', () => {
  it('27 kota/kabupaten dengan 5 yang belum terjangkau', () => {
    expect(REGIONS).toHaveLength(27);
    expect(REGIONS.filter((r) => !r.providers).map((r) => r.name)).toEqual([
      'Kab. Subang',
      'Kab. Majalengka',
      'Kab. Kuningan',
      'Kota Banjar',
      'Kab. Pangandaran',
    ]);
  });

  it('buildMapProviders menghasilkan satu entri per penyedia di peta', () => {
    const list = buildMapProviders(REGIONS, SAMPLE_ALUMNI);
    expect(list).toHaveLength(REGIONS.reduce((sum, r) => sum + r.providers, 0));
    expect(list.filter((p) => p.alumni === 'rizki-maulana')).toHaveLength(1);
    expect(list.some((p) => p.alumni === 'agus-setiawan')).toBe(false);
  });

  it('densityLevel mengikuti 5 tingkat legenda', () => {
    expect([0, 9, 20, 61, 214].map(densityLevel)).toEqual([0, 1, 2, 3, 4]);
  });
});
