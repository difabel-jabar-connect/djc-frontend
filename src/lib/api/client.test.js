import { vi } from 'vitest';
import { apiRequest, ApiError } from './client';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('apiRequest', () => {
  it('memakai base URL dari env dan mengirim cookie (credentials: include)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { status: 'ok' } }));
    vi.stubGlobal('fetch', fetchMock);

    const res = await apiRequest('/health');

    expect(res).toEqual({ data: { status: 'ok' } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/health');
    expect(init.credentials).toBe('include');
  });

  it('melempar ApiError berisi status, code, pesan, dan details dari server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'ACCOUNT_SUSPENDED',
              message: 'Akun Anda sedang ditangguhkan',
              details: { until: '2026-12-31' },
            },
          },
          403,
        ),
      ),
    );

    await expect(apiRequest('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      code: 'ACCOUNT_SUSPENDED',
      message: 'Akun Anda sedang ditangguhkan',
      details: { until: '2026-12-31' },
    });
  });

  it('memakai pesan & code fallback jika body error tidak sesuai kontrak', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 })));

    await expect(apiRequest('/x')).rejects.toMatchObject({
      status: 502,
      code: 'HTTP_502',
      message: 'Permintaan gagal (HTTP 502).',
      details: null,
    });
  });

  it('memetakan kegagalan jaringan ke ERR_NET_FAIL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await apiRequest('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('ERR_NET_FAIL');
  });
});
