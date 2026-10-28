import {
  daysSince,
  formatDate,
  formatDateTime,
  formatSchedule,
  formatScheduleLong,
  formatWaiting,
  inDateRange,
  initialsOf,
  isReasonValid,
  reasonError,
} from './adminFormat';

describe('format tanggal admin (WIB)', () => {
  it('memformat tanggal, jam, dan jadwal dalam WIB', () => {
    expect(formatDate('2026-10-27T17:30:00+07:00')).toBe('27 Okt 2026');
    expect(formatDateTime('2026-10-27T17:30:00+07:00')).toBe('27 Okt 2026, 17.30 WIB');
    // 23.30 UTC sudah berganti hari di WIB.
    expect(formatDateTime('2026-10-27T23:30:00Z')).toBe('28 Okt 2026, 06.30 WIB');
    expect(formatSchedule('2026-08-29T13:00:00+07:00')).toBe('Sab, 29 Agt 2026 · 13.00 WIB');
    expect(formatScheduleLong('2026-10-27T09:00:00+07:00', 2)).toBe(
      'Selasa, 27 Oktober 2026 · 09.00–11.00 WIB',
    );
  });

  it('menghitung lama menunggu dalam hari kalender', () => {
    const now = new Date('2026-10-27T10:00:00+07:00');
    expect(daysSince('2026-10-18T08:10:00+07:00', now)).toBe(9);
    expect(formatWaiting('2026-10-27T08:00:00+07:00', now)).toBe('Hari ini');
    expect(formatWaiting('2026-10-26T23:00:00+07:00', now)).toBe('1 hari');
  });

  it('rentang tanggal filter', () => {
    const now = new Date('2026-10-27T10:00:00+07:00');
    expect(inDateRange('2026-10-21T10:00:00+07:00', '7', now)).toBe(true);
    expect(inDateRange('2026-10-20T10:00:00+07:00', '7', now)).toBe(false);
    expect(inDateRange('2020-01-01T00:00:00Z', '', now)).toBe(true);
  });

  it('inisial nama', () => {
    expect(initialsOf('Rina Wulandari')).toBe('RW');
    expect(initialsOf('  andi  ')).toBe('A');
  });
});

describe('alasan aksi admin', () => {
  it('wajib minimal 10 karakter; galat hanya bila sudah diisi', () => {
    expect(reasonError('')).toBe('');
    expect(reasonError('Penipuan')).toBe('Alasan minimal 10 karakter.');
    expect(reasonError('Penipuan harga')).toBe('');
    expect(isReasonValid('   ')).toBe(false);
    expect(isReasonValid('', { required: false })).toBe(true);
  });
});
