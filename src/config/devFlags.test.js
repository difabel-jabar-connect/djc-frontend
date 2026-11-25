import { resolveDevFlags } from './devFlags';

describe('devFlags (kontrol UI debug & demo)', () => {
  it('menonaktifkan SEMUA flag debug di mode produksi (DEV=false) walau VITE_DEBUG_UI=true', () => {
    const prod = resolveDevFlags({ DEV: false, VITE_DEBUG_UI: 'true' });
    expect(prod).toEqual({
      SHOW_API_STATUS: false,
      SHOW_DEMO_ACCOUNTS: false,
      ALLOW_OFFLINE_AUTH_FALLBACK: false,
      SHOW_DEV_CONFIG_HINTS: false,
    });
  });

  it('mengaktifkan flag debug di mode development secara default', () => {
    const dev = resolveDevFlags({ DEV: true });
    expect(dev).toEqual({
      SHOW_API_STATUS: true,
      SHOW_DEMO_ACCOUNTS: true,
      ALLOW_OFFLINE_AUTH_FALLBACK: true,
      SHOW_DEV_CONFIG_HINTS: true,
    });
  });

  it('mengizinkan mematikan UI debug di development lewat VITE_DEBUG_UI=false untuk preview bersih', () => {
    const cleanDev = resolveDevFlags({ DEV: true, VITE_DEBUG_UI: 'false' });
    expect(cleanDev.SHOW_API_STATUS).toBe(false);
    expect(cleanDev.SHOW_DEMO_ACCOUNTS).toBe(false);
    expect(cleanDev.ALLOW_OFFLINE_AUTH_FALLBACK).toBe(false);
    expect(cleanDev.SHOW_DEV_CONFIG_HINTS).toBe(true);
  });
});
