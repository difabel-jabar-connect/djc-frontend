import { useCallback, useMemo, useState } from 'react';
import { logout as logoutRequest } from '@/features/auth/authApi';
import { SESSION_STORAGE_KEY as STORAGE_KEY, toSessionUser } from '@/features/auth/session';
import { AuthContext } from './useAuth';

function readStoredUser() {
  try {
    return toSessionUser(JSON.parse(sessionStorage.getItem(STORAGE_KEY)));
  } catch {
    return null;
  }
}

/**
 * Sesi pengguna di sisi klien. Token tetap di cookie HttpOnly (dikelola backend);
 * yang disimpan di sessionStorage hanya profil tampilan (nama, peran).
 * TODO(SP1-04): ganti pemulihan sesi dengan GET /auth/me saat aplikasi dimuat.
 */
export function AuthProvider({ children, initialUser }) {
  const [user, setUser] = useState(() =>
    initialUser !== undefined ? toSessionUser(initialUser) : readStoredUser(),
  );

  const signIn = useCallback((raw) => {
    const next = toSessionUser(raw);
    setUser(next);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Penyimpanan diblokir (mis. mode privat) — sesi tetap berlaku sampai halaman dimuat ulang.
    }
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Sesi tetap diakhiri di sisi klien walau server tidak merespons.
    }
    setUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // abaikan
    }
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
