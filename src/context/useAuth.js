import { createContext, useContext } from 'react';

export const AuthContext = createContext(null);

/** Sesi pengguna: `{ user, signIn, signOut }` (lihat <AuthProvider>). */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth harus dipakai di dalam <AuthProvider>.');
  return context;
}
