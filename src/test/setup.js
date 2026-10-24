import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sessionStorage.clear();
  localStorage.clear();
});

// jsdom tidak mengimplementasikan scrollTo.
window.scrollTo = () => {};

// jsdom belum mendukung <dialog>.showModal()/close(); cukup atur atribut `open`
// dan kirim event `close` seperti browser.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(returnValue) {
    if (!this.open) return;
    if (returnValue !== undefined) this.returnValue = returnValue;
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

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
