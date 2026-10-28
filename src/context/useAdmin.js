import { createContext, useContext } from 'react';

export const AdminContext = createContext(null);

/** Data & aksi area Admin, plus toast konfirmasi (lihat <AdminProvider>). */
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin harus dipakai di dalam <AdminProvider>.');
  return context;
}
