/**
 * Tujuan setelah login dari query `?next=`. Hanya path internal yang diizinkan
 * (diawali "/" tunggal) untuk mencegah open redirect ke domain lain.
 */
export function safeRedirectPath(next, fallback = '/') {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) {
    return fallback;
  }
  if (next.includes('\\') || /^\/[a-z][a-z0-9+.-]*:/i.test(next)) return fallback;
  return next;
}
