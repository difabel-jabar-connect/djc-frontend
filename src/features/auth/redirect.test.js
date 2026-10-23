import { safeRedirectPath } from './redirect';

describe('safeRedirectPath', () => {
  it('mengizinkan path internal', () => {
    expect(safeRedirectPath('/pesan/rizki-maulana?paket=x')).toBe('/pesan/rizki-maulana?paket=x');
  });

  it.each([
    [null],
    [''],
    ['https://jahat.example'],
    ['//jahat.example'],
    ['/\\jahat.example'],
    ['javascript:alert(1)'],
  ])('menolak tujuan tidak aman %s', (next) => {
    expect(safeRedirectPath(next)).toBe('/');
  });
});
