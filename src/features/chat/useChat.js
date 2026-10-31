import { useSyncExternalStore } from 'react';
import { getSnapshot, subscribe } from './chatStore';

/**
 * Berlangganan ke penyimpanan chat; komponen dirender ulang setiap ada pesan baru,
 * tanda dibaca, atau indikator mengetik — termasuk yang datang dari tab lain.
 */
export function useChatStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
