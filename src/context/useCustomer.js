import { createContext, useContext } from 'react';

export const CustomerContext = createContext(null);

/** Data pelanggan: pesanan, aksi pesanan, dan favorit (lihat <CustomerProvider>). */
export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer harus dipakai di dalam <CustomerProvider>.');
  return context;
}
