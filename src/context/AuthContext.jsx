import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser, logout as logoutRequest } from '@/features/auth/authApi';
import { SESSION_STORAGE_KEY as STORAGE_KEY, toSessionUser } from '@/features/auth/session';
import { AuthContext } from './useAuth';

function readStoredUser() {
  try {
    return toSessionUser(JSON.parse(sessionStorage.getItem(STORAGE_KEY)));
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Penyimpanan diblokir (mis. mode privat) — sesi tetap berlaku sampai halaman dimuat ulang.
  }
}

/**
 * Sesi pengguna di sisi klien. Token tetap di cookie HttpOnly (dikelola backend);
 * yang disimpan di sessionStorage hanya profil tampilan (nama, peran) agar UI tidak berkedip.
 * Saat aplikasi dimuat, sesi dicek ulang ke GET /auth/me: 401 → keluar, sukses → profil
 * diperbarui. Selama pengecekan `checking = true` (RequireAuth menunggu).
 * `initialUser` (untuk test) melewati pengecekan.
 */
export function AuthProvider({ children, initialUser }) {
  const hasInitialUser = initialUser !== undefined;
  const [user, setUser] = useState(() =>
    hasInitialUser ? toSessionUser(initialUser) : readStoredUser(),
  );
  // Akun demo (mode development) hanya sesi lokal, tidak punya cookie untuk dicek.
  const [checking, setChecking] = useState(() => !hasInitialUser && !user?.demo);

  useEffect(() => {
    if (!checking) return undefined;
    let active = true;
    fetchCurrentUser()
      .then((raw) => {
        if (!active) return;
        const next = toSessionUser(raw);
        setUser(next);
        storeUser(next);
      })
      .catch((error) => {
        if (!active) return;
        // Server tidak terjangkau: pertahankan profil tersimpan, dicek lagi saat dimuat ulang.
        if (error?.status === 401) {
          setUser(null);
          storeUser(null);
        }
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
    // Hanya sekali saat aplikasi dimuat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback((raw) => {
    const next = toSessionUser(raw);
    setUser(next);
    setChecking(false);
    storeUser(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Sesi tetap diakhiri di sisi klien walau server tidak merespons.
    }
    setUser(null);
    storeUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, checking, signIn, signOut }),
    [user, checking, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
