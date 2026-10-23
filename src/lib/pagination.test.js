import { getPageItems } from './pagination';

describe('getPageItems', () => {
  it('menampilkan semua nomor bila halaman sedikit', () => {
    expect(getPageItems(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it('memakai elipsis seperti desain (halaman 1 dari 7 → 1 2 3 4 5 … 7)', () => {
    expect(getPageItems(1, 7)).toEqual([1, 2, 3, 4, 5, '…', 7]);
    expect(getPageItems(5, 9)).toEqual([1, '…', 3, 4, 5, 6, 7, '…', 9]);
    expect(getPageItems(9, 9)).toEqual([1, '…', 5, 6, 7, 8, 9]);
    expect(getPageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});
