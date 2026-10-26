import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Tiruan Google Identity Services: `requestCode()` langsung memanggil callback
 * (berhasil) atau error_callback (popup ditutup).
 */
function mockGoogle({ code = 'kode-google', popupError } = {}) {
  const initCodeClient = vi.fn((config) => ({
    requestCode: () =>
      popupError ? config.error_callback({ type: popupError }) : config.callback({ code }),
  }));
  vi.stubGlobal('google', { accounts: { oauth2: { initCodeClient } } });
  return initCodeClient;
}

beforeEach(() => vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id.apps.googleusercontent.com'));

describe('Masuk dengan Google', () => {
  it('membuka popup Google, mengirim code ke backend, lalu masuk sesuai peran', async () => {
    const initCodeClient = mockGoogle();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ data: { user: { name: 'Budi Santoso', role: 'customer' } } }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/login');

    await user.click(screen.getByRole('button', { name: 'Masuk dengan Google' }));

    expect(initCodeClient).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'client-id.apps.googleusercontent.com',
        scope: 'openid email profile',
        ux_mode: 'popup',
      }),
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/auth/google');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body)).toEqual({ code: 'kode-google', intent: 'login' });
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByRole('heading', { level: 1, name: /halo, budi!/i })).toBeVisible();
  });

  it('akun Google belum terdaftar (404) menawarkan daftar', async () => {
    mockGoogle();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'NOT_FOUND', message: 'x' } }, 404)),
    );
    const user = userEvent.setup();
    renderAt('/login');

    await user.click(screen.getByRole('button', { name: 'Masuk dengan Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Akun Google ini belum terdaftar.');
    expect(screen.getByRole('link', { name: 'Daftar dengan Google' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('popup ditutup tidak memanggil backend dan memberi info', async () => {
    mockGoogle({ popupError: 'popup_closed' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/login');

    await user.click(screen.getByRole('button', { name: 'Masuk dengan Google' }));
    expect(await screen.findByRole('status')).toHaveTextContent(/jendela google ditutup/i);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Masuk dengan Google' })).toBeEnabled();
  });

  it('tanpa VITE_GOOGLE_CLIENT_ID menampilkan petunjuk konfigurasi', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    const user = userEvent.setup();
    renderAt('/login');

    await user.click(screen.getByRole('button', { name: 'Masuk dengan Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/VITE_GOOGLE_CLIENT_ID/);
  });
});

describe('Daftar dengan Google', () => {
  it('tetap wajib menyetujui S&K sebelum membuka Google', async () => {
    const initCodeClient = mockGoogle();
    const user = userEvent.setup();
    renderAt('/register');

    await user.click(screen.getByRole('button', { name: 'Daftar dengan Google' }));
    expect(initCodeClient).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: /saya menyetujui/i })).toHaveFocus();
    // Nama/email/sandi tidak diwajibkan karena diambil dari akun Google.
    expect(screen.queryByText('Nama lengkap wajib diisi.')).not.toBeInTheDocument();
  });

  it('Pengguna: daftar lalu langsung masuk ke beranda', async () => {
    mockGoogle();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ data: { user: { name: 'Rina Amalia', role: 'customer' } } }, 201),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/register');

    await user.click(screen.getByRole('checkbox', { name: /saya menyetujui/i }));
    await user.click(screen.getByRole('button', { name: 'Daftar dengan Google' }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      code: 'kode-google',
      intent: 'register',
      role: 'customer',
    });
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('Mitra: kota & kategori wajib, lalu ke halaman berhasil (menunggu verifikasi)', async () => {
    mockGoogle();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          data: {
            user: { name: 'Siti', email: 'siti.nurjanah@gmail.com', role: 'provider' },
          },
        },
        201,
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/register?peran=mitra');

    await user.click(screen.getByRole('checkbox', { name: /saya menyetujui/i }));
    await user.click(screen.getByRole('button', { name: 'Daftar dengan Google' }));
    expect(screen.getByLabelText(/kota\/kabupaten domisili/i)).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    const kota = screen.getByLabelText(/kota\/kabupaten domisili/i);
    await user.selectOptions(kota, kota.querySelectorAll('option')[1]);
    const kategori = screen.getByLabelText(/kategori keahlian/i);
    await user.selectOptions(kategori, kategori.querySelectorAll('option')[1]);
    await user.click(screen.getByRole('button', { name: 'Daftar dengan Google' }));

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ intent: 'register', role: 'provider' });
    expect(body.city).toBeTruthy();
    expect(body.category).toBeTruthy();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pendaftaran Berhasil!' }),
    ).toBeVisible();
    expect(screen.getByText(/terhubung dengan google/i)).toHaveTextContent('siti•••@gmail.com');
    expect(screen.getByText(/menunggu verifikasi pengelola/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Kirim ulang' })).not.toBeInTheDocument();
  });

  it('akun Google sudah terdaftar (409) mengarahkan ke Masuk', async () => {
    mockGoogle();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'CONFLICT', message: 'x' } }, 409)),
    );
    const user = userEvent.setup();
    renderAt('/register');

    await user.click(screen.getByRole('checkbox', { name: /saya menyetujui/i }));
    await user.click(screen.getByRole('button', { name: 'Daftar dengan Google' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Akun Google ini sudah terdaftar.');
    expect(within(alert).getByRole('link', { name: 'Masuk' })).toHaveAttribute('href', '/login');
  });
});
