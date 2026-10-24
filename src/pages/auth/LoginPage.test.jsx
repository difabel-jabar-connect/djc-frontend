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

  it('login berhasil mengirim kredensial lalu kembali ke halaman tujuan', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ data: { id: 1, role: 'customer' } }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/login?next=%2Fpesan%2Frizki-maulana');

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

  it('menolak redirect ke domain luar setelah login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ data: {} })));
    const user = userEvent.setup();
    const { router } = renderAt('/login?next=https%3A%2F%2Fjahat.example');
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

  it('akun demo (mode development) langsung masuk sesuai peran', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/login');

    const demo = within(screen.getByRole('region', { name: /akun demo/i }));
    await user.click(demo.getByRole('button', { name: /pelanggan/i }));

    expect(router.state.location.pathname).toBe('/');
    expect(await screen.findByRole('heading', { level: 1, name: /halo, budi!/i })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.anything(),
    );
  });
});
