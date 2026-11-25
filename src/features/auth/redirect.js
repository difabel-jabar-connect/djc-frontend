const AUTH_REDIRECT_KEY = 'djc.auth.from';

const AUTH_PREFIXES = ['/login', '/register', '/lupa-kata-sandi', '/reset-kata-sandi'];

/**
 * Validasi tujuan redirect setelah login/daftar (OWASP A01 Open Redirect):
 * hanya path internal (diawali "/" tunggal), bebas karakter kontrol/backslash/skema,
 * dan bukan halaman auth agar tidak terjadi redirect loop.
 */
export function safeRedirectPath(next, fallback = '/') {
  if (typeof next !== 'string' || next.length > 500) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  // eslint-disable-next-line no-control-regex -- cegah bypass parser URL via control chars
  if (/[\u0000-\u001f\u007f]/.test(next)) return fallback;
  if (next.includes('\\') || /^\/[a-z][a-z0-9+.-]*:/i.test(next)) return fallback;
  const pathname = next.split(/[?#]/)[0];
  if (AUTH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return fallback;
  }
  return next;
}

/** Konversi nilai `state.from` (string atau Location object) menjadi path aman atau null. */
export function normalizeFrom(from) {
  if (!from) return null;
  const raw =
    typeof from === 'string'
      ? from
      : typeof from === 'object' && typeof from.pathname === 'string'
        ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
        : null;
  return raw ? safeRedirectPath(raw, null) : null;
}

/** Simpan tujuan sementara di sessionStorage (cadangan bila user me-refresh /login). */
export function saveAuthRedirect(path) {
  const safe = normalizeFrom(path);
  try {
    if (safe) sessionStorage.setItem(AUTH_REDIRECT_KEY, safe);
    else sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  } catch {
    // Abaikan di mode privat/storage diblokir.
  }
  return safe;
}

/** Baca tujuan pasca-login dari React Router `location.state` (utama) atau sessionStorage. */
export function readAuthRedirect(locationState) {
  const fromState = normalizeFrom(locationState?.from);
  if (fromState) return fromState;
  try {
    return normalizeFrom(sessionStorage.getItem(AUTH_REDIRECT_KEY));
  } catch {
    return null;
  }
}

export function clearAuthRedirect() {
  try {
    sessionStorage.removeItem(AUTH_REDIRECT_KEY);
  } catch {
    // abaikan
  }
}
