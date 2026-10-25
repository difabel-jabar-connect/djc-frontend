import { vi } from 'vitest';
import { getApiBaseUrl } from './env';

describe('getApiBaseUrl', () => {
  it('membaca VITE_API_BASE_URL dan membuang garis miring di akhir', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://contoh.up.railway.app/api/v1/');
    expect(getApiBaseUrl()).toBe('https://contoh.up.railway.app/api/v1');
  });

  it('memberi error jelas bila variabel belum diatur', () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    expect(() => getApiBaseUrl()).toThrow(/VITE_API_BASE_URL belum diatur/);
  });
});
