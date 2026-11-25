import {
  clearAuthRedirect,
  readAuthRedirect,
  safeRedirectPath,
  saveAuthRedirect,
} from './redirect';

describe('safeRedirectPath', () => {
  beforeEach(() => sessionStorage.clear());

  it('mengizinkan path internal', () => {
    expect(safeRedirectPath('/pesan/rizki-maulana?paket=x')).toBe('/pesan/rizki-maulana?paket=x');
  });

  it.each([
    [null],
    [''],
    ['https://jahat.example'],
    ['//jahat.example'],
    ['/\\jahat.example'],
    ['/\t/jahat.example'],
    ['javascript:alert(1)'],
    ['/login'],
    ['/register?peran=mitra'],
  ])('menolak tujuan tidak aman atau loop auth %s', (next) => {
    expect(safeRedirectPath(next)).toBe('/');
  });

  it('menyimpan dan membaca tujuan pasca-login via location.state dan sessionStorage', () => {
    expect(readAuthRedirect({ from: '/bookings?status=selesai' })).toBe('/bookings?status=selesai');
    expect(readAuthRedirect({ from: 'https://jahat.example' })).toBeNull();
    saveAuthRedirect('/pesan/deni?langkah=3');
    expect(readAuthRedirect(null)).toBe('/pesan/deni?langkah=3');
    clearAuthRedirect();
    expect(readAuthRedirect(null)).toBeNull();
  });
});
