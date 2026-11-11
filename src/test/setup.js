import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion';
import { resetChatStore } from '@/features/chat/chatStore';
import { clearSearchCache } from '@/features/search/useProviderSearch';
import { fakeApi, fakeFetch } from './fakeApi';

// Animasi Motion langsung selesai di test, dan elemen dirender langsung di keadaan
// akhirnya (initial={false}) agar pemeriksaan "terlihat" tidak bergantung pada frame animasi.
MotionGlobalConfig.skipAnimations = true;
vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal();
  const { createElement, forwardRef } = await import('react');
  const cache = new Map();
  const settled = (tag) => {
    if (!cache.has(tag)) {
      const Component = forwardRef(function Settled(props, ref) {
        return createElement(actual.motion[tag], { ...props, initial: false, ref });
      });
      cache.set(tag, Component);
    }
    return cache.get(tag);
  };
  return { ...actual, motion: new Proxy(actual.motion, { get: (_, tag) => settled(tag) }) };
});

// jsdom tidak punya IntersectionObserver: anggap semua elemen langsung terlihat
// (dipakai whileInView untuk reveal saat scroll).
class InstantIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe(target) {
    this.callback([{ isIntersecting: true, intersectionRatio: 1, target }], this);
  }

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}
if (!('IntersectionObserver' in window)) {
  window.IntersectionObserver = InstantIntersectionObserver;
}

// Backend tiruan (GET /services, GET /providers/:id, POST /bookings) untuk setiap test.
// Test yang butuh respons lain cukup memasang vi.stubGlobal('fetch', …) sendiri.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
});

afterEach(() => {
  cleanup();
  fakeApi.reset();
  clearSearchCache();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  sessionStorage.clear();
  localStorage.clear();
  resetChatStore();
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
