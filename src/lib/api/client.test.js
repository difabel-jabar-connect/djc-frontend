import { vi } from 'vitest';
import { apiRequest, ApiError } from './client';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('apiRequest', () => {
  it('memakai base URL dari env dan mengirim cookie (credentials: include)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ status: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    const data = await apiRequest('/health');

    expect(data).toEqual({ status: 'ok' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/health');
    expect(init.credentials).toBe('include');
  });

  it('melempar ApiError berisi status & pesan dari server', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ message: 'Akun Anda sedang ditangguhkan' }, 403)),
    );

    await expect(apiRequest('/x')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      message: 'Akun Anda sedang ditangguhkan',
    });
  });

  it('memetakan kegagalan jaringan ke ERR_NET_FAIL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await apiRequest('/x').catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe('ERR_NET_FAIL');
  });
});
