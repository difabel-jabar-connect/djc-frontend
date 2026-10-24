import { toCsv } from './csv';

describe('toCsv', () => {
  it('menggabungkan sel dan meng-escape koma, kutip, serta baris baru', () => {
    expect(
      toCsv([
        ['Indikator', 'Nilai'],
        ['Alumni, aktif', 2346],
        ['Catatan "penting"', 'baris\nbaru'],
        [],
      ]),
    ).toBe('Indikator,Nilai\n"Alumni, aktif",2346\n"Catatan ""penting""","baris\nbaru"\n');
  });
});
