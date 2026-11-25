import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function fillAndSubmit(user, { email = 'rina@email.com', password = 'rahasia123' } = {}) {
  await user.type(screen.getByLabelText(/^email/i), email);
  await user.type(screen.getByLabelText(/^kata sandi/i), password);
  await user.click(screen.getByRole('button', { name: 'Masuk' }));
}

describe('Halaman Masuk', () => {
  it('tampil tanpa header & footer utama', () => {
    renderAt('/login');
    expect(
      screen.getByRole('heading', { level: 1, name: /selamat datang kembali/i }),
    ).toBeVisible();
    expect(screen.queryByRole('navigation', { name: /navigasi utama/i })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('memvalidasi isian kosong & format email tanpa memanggil API', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/login');

    await user.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Kata sandi wajib diisi.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveFocus();

    await user.type(screen.getByLabelText(/^email/i), 'bukan-email');
    expect(screen.getByText(/format email belum benar/i)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('tombol mata menampilkan/menyembunyikan kata sandi', async () => {
    const user = userEvent.setup();
    renderAt('/login');
    const input = screen.getByLabelText(/^kata sandi/i);
    const toggle = screen.getByRole('button', { name: 'Tampilkan kata sandi' });

    expect(input).toHaveAttribute('type', 'password');
    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('login berhasil mengirim kredensial lalu kembali ke halaman tujuan tanpa ?next= di URL', async () => {
    sessionStorage.clear();
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(jsonResponse({ data: { id: 1, role: 'customer' } })),
      );
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt({
      pathname: '/login',
      state: { from: '/pesan/rizki-maulana' },
    });

    expect(router.state.location.search).toBe('');
    await user.click(screen.getByLabelText(/ingat saya/i));
    await fillAndSubmit(user);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/auth/login');
    expect(init.credentials).toBe('include');
    expect(JSON.parse(init.body)).toEqual({
      email: 'rina@email.com',
      password: 'rahasia123',
      remember: true,
    });
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/pesan/rizki-maulana'));
  });

  it('menolak redirect ke domain luar dan membersihkan ?next= lama dari address bar', async () => {
    sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ data: {} }))),
    );
    const user = userEvent.setup();
    const { router } = renderAt('/login?next=https%3A%2F%2Fjahat.example');
    await vi.waitFor(() => expect(router.state.location.search).toBe(''));
    await fillAndSubmit(user);
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'));
  });

  it('menampilkan pesan bila email/kata sandi salah (401)', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid' } }, 401),
        ),
    );
    const user = userEvent.setup();
    renderAt('/login');
    await fillAndSubmit(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(/email atau kata sandi salah/i);
  });

  it('tanpa ?next=, login mengarahkan sesuai peran dari respons API', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ data: { user: { id: 3, name: 'Deni Setiawan', role: 'provider' } } }),
        ),
    );
    const user = userEvent.setup();
    const { router } = renderAt('/login');
    await fillAndSubmit(user);
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/provider'));
    expect(JSON.parse(sessionStorage.getItem('djc.session'))).toMatchObject({
      name: 'Deni Setiawan',
      role: 'provider',
      initials: 'DS',
    });
  });

  it('akun demo (mode development) login ke backend memakai akun seed bila server aktif', async () => {
    const fetchMock = vi.fn().mockImplementation((input) => {
      if (String(input).endsWith('/auth/login')) {
        return Promise.resolve(
          jsonResponse({
            data: {
              user: {
                id: '11111111-1111-4111-8111-111111111111',
                name: 'Budi Santoso',
                email: 'budi@djc.test',
                role: 'customer',
              },
            },
          }),
        );
      }
      return Promise.resolve(jsonResponse({ data: [] }));
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/login');

    const demo = within(screen.getByRole('region', { name: /akun demo/i }));
    await user.click(demo.getByRole('button', { name: /pelanggan/i }));

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByRole('heading', { level: 1, name: /halo, budi!/i })).toBeVisible();
    const loginCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/login'));
    expect(loginCall).toBeTruthy();
    expect(JSON.parse(loginCall[1].body)).toMatchObject({ email: 'budi@djc.test' });
  });

  it('akun demo (mode development) fallback ke sesi lokal saat backend tidak tersedia', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/login');

    const demo = within(screen.getByRole('region', { name: /akun demo/i }));
    await user.click(demo.getByRole('button', { name: /pelanggan/i }));

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(await screen.findByRole('heading', { level: 1, name: /halo, budi!/i })).toBeVisible();
  });
});
