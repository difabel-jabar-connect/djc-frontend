import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// jsdom tidak mengimplementasikan scrollTo.
window.scrollTo = () => {};

// Di Node 24, `Request` bawaan Node (undici) menolak AbortSignal milik jsdom,
// padahal React Router membuat Request setiap navigasi. Signal tidak dibutuhkan
// di test, jadi dibuang saat membuat Request.
const NativeRequest = globalThis.Request;
globalThis.Request = class Request extends NativeRequest {
  constructor(input, init) {
    if (init?.signal) {
      // eslint-disable-next-line no-unused-vars
      const { signal, ...rest } = init;
      super(input, rest);
    } else {
      super(input, init);
    }
  }
};
