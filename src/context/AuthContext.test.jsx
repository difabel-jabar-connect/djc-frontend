import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { vi } from 'vitest';
import { routes } from '@/routes/routes';
import { AuthProvider } from '@/context/AuthContext';
import { CustomerProvider } from '@/context/CustomerContext';
import { useAuth } from '@/context/useAuth';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Render aplikasi seperti di browser: tanpa `initialUser`, jadi sesi dicek ke GET /auth/me. */
function renderApp(path) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AuthProvider>
      <CustomerProvider>
        <RouterProvider router={router} />
      </CustomerProvider>
    </AuthProvider>,
  );
  return router;
}

function SessionProbe() {
  const { user, checking, signOut } = useAuth();
  return (
    <div>
      <p>{checking ? 'memeriksa' : 'siap'}</p>
      <p>{user ? `masuk sebagai ${user.name} (${user.role})` : 'belum masuk'}</p>
      <button type="button" onClick={signOut}>
        Keluar
      </button>
    </div>
  );
}

describe('AuthProvider + GET /auth/me', () => {
  it('memulihkan sesi dari cookie (tab baru) dan membuka rute yang dilindungi', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          user: { id: 'p1', role: 'provider', full_name: 'Deni Setiawan', status: 'active' },
          provider_profile: { id: 'pp1', verification_status: 'verified' },
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const router = renderApp('/dashboard/provider');
    const visited = [];
    router.subscribe((state) => visited.push(state.location.pathname));

    await vi.waitFor(() =>
      expect(JSON.parse(sessionStorage.getItem('djc.session'))).toMatchObject({
        name: 'Deni Setiawan',
        role: 'provider',
        initials: 'DS',
        provider_profile: { verification_status: 'verified' },
      }),
    );
    expect(router.state.location.pathname).toBe('/dashboard/provider');
    // Tidak sempat terlempar ke halaman Masuk selama sesi dicek.
    expect(visited).not.toContain('/login');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/auth/me');
    expect(init.credentials).toBe('include');
  });

  it('401 dari /auth/me menghapus profil tersimpan lalu mengarahkan ke halaman Masuk', async () => {
    sessionStorage.setItem(
      'djc.session',
      JSON.stringify({ id: 'u1', role: 'customer', name: 'Budi Santoso' }),
    );
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: { code: 'UNAUTHENTICATED', message: 'Silakan masuk.' } }, 401),
        ),
    );

    const router = renderApp('/bookings');

    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toBe('?next=%2Fbookings');
    expect(sessionStorage.getItem('djc.session')).toBeNull();
  });

  it('selama sesi dicek, rute yang dilindungi menampilkan status memuat', () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));

    const router = renderApp('/bookings');

    expect(screen.getByText(/memeriksa sesi/i)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/bookings');
  });

  it('server tidak terjangkau: profil tersimpan dipertahankan', async () => {
    sessionStorage.setItem(
      'djc.session',
      JSON.stringify({ id: 'u1', role: 'customer', name: 'Budi Santoso' }),
    );
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(await screen.findByText('siap')).toBeInTheDocument();
    expect(screen.getByText('masuk sebagai Budi Santoso (customer)')).toBeInTheDocument();
  });

  it('akun demo tidak dicek ke server', () => {
    sessionStorage.setItem(
      'djc.session',
      JSON.stringify({ id: 'u-budi', role: 'customer', name: 'Budi Santoso', demo: true }),
    );
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );

    expect(screen.getByText('siap')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('signOut memanggil POST /auth/logout dan menghapus sesi', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: { user: { id: 'u1', role: 'customer', full_name: 'Budi Santoso' } } }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: { logged_out: true } }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <SessionProbe />
      </AuthProvider>,
    );
    expect(await screen.findByText('masuk sebagai Budi Santoso (customer)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keluar' }));

    expect(await screen.findByText('belum masuk')).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('http://api.test/api/v1/auth/logout');
    expect(init.method).toBe('POST');
    expect(sessionStorage.getItem('djc.session')).toBeNull();
  });
});
