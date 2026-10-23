import { getApiBaseUrl } from '@/config/env';

/**
 * Error terstandar dari lapisan API agar UI bisa memetakan ke 6 state antarmuka
 * (Error, Unauthorized/Forbidden, dsb.) secara konsisten.
 */
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'ERR_UNKNOWN', details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Wrapper fetch minimal.
 * - `credentials: 'include'` → sesi memakai HttpOnly cookie dari backend.
 *   Token JWT TIDAK disimpan di localStorage (batasan arsitektur klien).
 */
export async function apiRequest(path, { method = 'GET', body, headers, signal } = {}) {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', {
      code: 'ERR_NET_FAIL',
    });
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(payload?.message || `Permintaan gagal (HTTP ${response.status}).`, {
      status: response.status,
      code: payload?.code || `HTTP_${response.status}`,
      details: payload,
    });
  }

  return payload;
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
};
