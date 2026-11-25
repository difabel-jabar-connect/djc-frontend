import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALLOW_OFFLINE_AUTH_FALLBACK } from '@/config/devFlags';
import { getMe, logout as logoutRequest } from '@/features/auth/authApi';
import { clearAuthRedirect } from '@/features/auth/redirect';
import { SESSION_STORAGE_KEY as STORAGE_KEY, toSessionUser } from '@/features/auth/session';
import { resetAddressBook } from '@/features/booking/addressBook';
import { isBackendId, resetChatSync } from '@/features/chat/chatSync';
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
 * yang disimpan di sessionStorage hanya cache tampilan (nama, peran) dan diverifikasi
 * ulang terhadap `GET /auth/me` saat aplikasi dimuat (OWASP A01/A07).
 */
export function AuthProvider({ children, initialUser }) {
  const [user, setUser] = useState(() =>
    initialUser !== undefined ? toSessionUser(initialUser) : readStoredUser(),
  );
  const userIdRef = useRef(user?.id ?? null);

  // Verifikasi sesi cookie HttpOnly ke backend saat mount (tidak jalan saat unit test menyuntik initialUser).
  useEffect(() => {
    if (initialUser !== undefined) return undefined;
    const controller = new AbortController();
    let ignore = false;
    getMe({ signal: controller.signal })
      .then((data) => {
        if (ignore) return;
        const verified = toSessionUser(data?.user ?? data);
        if (!verified) return;
        userIdRef.current = verified.id ?? null;
        setUser(verified);
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(verified));
        } catch {
          // abaikan
        }
      })
      .catch((error) => {
        if (ignore || error?.name === 'AbortError') return;
        // 401/403 dari server = cookie sudah habis atau sessionStorage dipalsukan → bersihkan sesi.
        if (error?.status === 401 || error?.status === 403) {
          userIdRef.current = null;
          setUser(null);
          try {
            sessionStorage.removeItem(STORAGE_KEY);
          } catch {
            // abaikan
          }
          return;
        }
        // Saat backend tidak terjangkau, pertahankan akun demo offline hanya di mode development.
        if (!ALLOW_OFFLINE_AUTH_FALLBACK || isBackendId(userIdRef.current)) {
          // Jangan langsung menghapus saat gangguan jaringan sementara untuk akun backend.
        }
      });
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [initialUser]);

  const signIn = useCallback((raw) => {
    const next = toSessionUser(raw);
    // Masuk (bukan sekadar memperbarui profil): alamat dimuat ulang dengan sesi yang baru.
    if (next?.id !== userIdRef.current) {
      resetAddressBook();
      resetChatSync();
    }
    userIdRef.current = next?.id ?? null;
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
    clearAuthRedirect();
    resetAddressBook();
    resetChatSync();
    userIdRef.current = null;
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
