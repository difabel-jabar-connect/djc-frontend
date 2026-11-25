import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { fakeApi, fakeFetch } from '@/test/fakeApi';
import { renderAt } from '@/test/renderWithRouter';

const adminSession = { user: DEMO_ACCOUNTS.admin };
const LIVE_ADMIN = {
  id: '99999999-9999-4999-8999-999999999999',
  role: 'admin',
  name: 'Pengelola UPTD PPSGHD',
  email: 'admin@djc.test',
};

describe('Dashboard Admin', () => {
  beforeEach(() => fakeApi.reset());
  afterEach(() => vi.unstubAllGlobals());

  it('melindungi /admin dengan RequireAuth role admin', () => {
    const guest = renderAt('/admin');
    expect(guest.router.state.location.pathname).toBe('/login');
    guest.unmount();

    const customer = renderAt('/admin', { user: DEMO_ACCOUNTS.customer });
    expect(customer.router.state.location.pathname).toBe('/');
    customer.unmount();

    const provider = renderAt('/admin', { user: DEMO_ACCOUNTS.provider });
    expect(provider.router.state.location.pathname).toBe('/dashboard/provider');
  });

  it('menampilkan sapaan, ringkasan, antrean, aktivitas, dan grafik beraksesibel', () => {
    renderAt('/admin', adminSession);
    expect(
      screen.getByRole('heading', { level: 1, name: /selamat datang, andi pratama/i }),
    ).toBeVisible();

    const stats = within(screen.getByRole('region', { name: /ringkasan platform/i }));
    expect(stats.getByText('10')).toBeInTheDocument();
    expect(stats.getByText('2.346')).toBeInTheDocument();
    expect(stats.getByRole('link', { name: /tinjau sekarang/i })).toHaveAttribute(
      'href',
      '/admin/verifikasi',
    );

    // Antrean verifikasi: terlama di atas, maksimal 5 baris.
    const queue = within(screen.getByRole('table', { name: /antrean verifikasi/i }));
    const rows = queue.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent('Rudi Hartono');
    expect(queue.getByRole('link', { name: 'Tinjau pendaftaran Rudi Hartono' })).toHaveAttribute(
      'href',
      '/admin/verifikasi',
    );

    const activity = within(screen.getByRole('region', { name: /aktivitas terbaru/i }));
    expect(activity.getAllByRole('listitem')[0]).toHaveTextContent(
      /andi pratama menyetujui yuni astuti sebagai penyedia/i,
    );

    expect(
      screen.getByRole('img', {
        name: /pesanan harian 28 sep 2026 sampai 27 okt 2026, .*tertinggi 10 pesanan pada 17 okt/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/207 pesanan/)).toBeInTheDocument();

    const todo = within(screen.getByRole('region', { name: /perlu tindakan/i }));
    expect(todo.getByRole('link', { name: 'Buka: Ulasan dilaporkan, 2' })).toHaveAttribute(
      'href',
      '/admin/ulasan?tab=dilaporkan',
    );
  });

  it('rentang waktu mengubah grafik tren pesanan', async () => {
    const user = userEvent.setup();
    renderAt('/admin', adminSession);
    await user.selectOptions(screen.getByLabelText('Rentang waktu'), '7');
    expect(screen.getByText(/total 7 hari/i)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /pesanan harian 21 okt 2026 sampai 27 okt 2026/i }),
    ).toBeInTheDocument();
  });

  it('sidebar menandai halaman aktif dan berpindah ke halaman admin lain', async () => {
    const user = userEvent.setup();
    renderAt('/admin', adminSession);
    const nav = screen.getByRole('navigation', { name: /menu admin/i });
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      within(nav).getByRole('link', { name: 'Verifikasi Penyedia, 10 menunggu' }),
    ).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Pengaturan' })).toHaveAttribute(
      'href',
      '/admin/pengaturan',
    );

    await user.click(within(nav).getByRole('link', { name: 'Kelola User' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Kelola User' })).toBeVisible();
    expect(within(nav).getByRole('link', { name: 'Kelola User' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('menu akun membuka dan menutup dengan Escape', async () => {
    const user = userEvent.setup();
    renderAt('/admin', adminSession);
    const button = screen.getByRole('button', { name: /andi pratama/i });
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('mode live API: memuat metrik database, verifikasi penyedia, kelola kategori, moderasi ulasan, dan suspensi user', async () => {
    vi.stubGlobal('fetch', vi.fn(fakeFetch));
    const user = userEvent.setup();
    renderAt('/admin', { user: LIVE_ADMIN });

    // 1. Dashboard memuat metrik dari GET /admin/dashboard dan distribusi status live (bukan grafik dummy)
    expect(await screen.findByText('Yusuf Hidayat')).toBeVisible();
    const stats = within(screen.getByRole('region', { name: /ringkasan platform/i }));
    expect(stats.getByText('7')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: /distribusi status pesanan database/i })).toBeVisible();
    expect(screen.queryByText(/207 pesanan/)).not.toBeInTheDocument();

    // 2. Verifikasi penyedia → PUT /admin/providers/:id/verify
    const nav = screen.getByRole('navigation', { name: /menu admin/i });
    await user.click(within(nav).getByRole('link', { name: /verifikasi penyedia/i }));
    await user.click(
      await screen.findByRole('button', { name: 'Tinjau pendaftaran Yusuf Hidayat' }),
    );
    await user.click(screen.getByRole('button', { name: 'Setujui' }));
    const verifyDialog = within(screen.getByRole('dialog', { name: 'Setujui penyedia?' }));
    await user.click(verifyDialog.getByRole('button', { name: 'Ya, Setujui' }));
    expect(
      await screen.findByText(/yusuf hidayat disetujui sebagai penyedia/i),
    ).toBeInTheDocument();

    // 3. Kategori layanan → POST /admin/categories & PUT /admin/categories/:id
    await user.click(within(nav).getByRole('link', { name: 'Kategori Layanan' }));
    expect(await screen.findByText('Servis Elektronik')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Tambah Kategori' }));
    const catDialog = within(screen.getByRole('dialog', { name: 'Tambah Kategori' }));
    await user.type(catDialog.getByRole('textbox', { name: /nama kategori/i }), 'Fotografi');
    await user.click(catDialog.getByRole('button', { name: 'Simpan' }));
    expect(await screen.findByText(/kategori “fotografi” ditambahkan/i)).toBeInTheDocument();

    // 4. Moderasi ulasan → PUT /admin/reviews/:id/moderate
    await user.click(within(nav).getByRole('link', { name: /moderasi ulasan/i }));
    await user.click(
      await screen.findByRole('button', { name: /sembunyikan ulasan bk-eeee1111/i }),
    );
    const revDialog = within(screen.getByRole('dialog', { name: 'Sembunyikan ulasan?' }));
    await user.type(
      revDialog.getByRole('textbox', { name: /alasan/i }),
      'Ulasan mengandung spam promosi.',
    );
    await user.click(revDialog.getByRole('button', { name: 'Ya, Sembunyikan' }));
    expect(await screen.findByText(/ulasan bk-eeee1111 disembunyikan/i)).toBeInTheDocument();

    // 5. Tambah Mitra Penyedia → POST /admin/providers & Suspensi akun → PUT /admin/users/:id/suspend
    await user.click(within(nav).getByRole('link', { name: 'Kelola User' }));
    await user.click(screen.getByRole('button', { name: /tambah mitra penyedia/i }));
    const addProvDialog = within(
      screen.getByRole('dialog', { name: 'Tambah Akun Mitra Penyedia' }),
    );
    await user.type(addProvDialog.getByLabelText(/nama lengkap/i), 'Agus Salim');
    await user.type(addProvDialog.getByLabelText(/email/i), 'agus@djc.test');
    await user.clear(addProvDialog.getByLabelText(/nomor whatsapp/i));
    await user.type(addProvDialog.getByLabelText(/nomor whatsapp/i), '+6281234567899');
    await user.type(addProvDialog.getByLabelText(/nomor registrasi alumni/i), 'AL-2026-099');
    await user.type(addProvDialog.getByLabelText(/kata sandi awal/i), 'Rahasia123');
    await user.click(addProvDialog.getByRole('button', { name: 'Buat Akun Mitra' }));
    expect(await screen.findByText(/akun mitra agus salim berhasil dibuat/i)).toBeInTheDocument();

    const budiRow = (await screen.findByText('Budi Santoso')).closest('tr');
    await user.click(within(budiRow).getByRole('button', { name: 'Aksi lain untuk Budi Santoso' }));
    await user.click(screen.getByRole('menuitem', { name: 'Suspensi akun' }));
    const suspDialog = within(screen.getByRole('dialog', { name: 'Suspensi akun?' }));
    await user.type(
      suspDialog.getByRole('textbox', { name: /alasan/i }),
      'Terindikasi pesanan palsu berulang.',
    );
    await user.click(suspDialog.getByRole('button', { name: 'Ya, Suspensi' }));
    expect(await screen.findByText(/akun budi santoso disuspensi/i)).toBeInTheDocument();

    const called = fakeApi.calls.map((c) => `${c.method} ${c.path}`);
    expect(called).toEqual(
      expect.arrayContaining([
        'GET /admin/dashboard',
        'GET /admin/providers',
        'POST /admin/providers',
        'GET /admin/categories',
        'GET /admin/reviews',
        'GET /admin/users',
        'PUT /admin/providers/aaaa1111-1111-4111-8111-111111111111/verify',
        'POST /admin/categories',
        'PUT /admin/reviews/dddd1111-1111-4111-8111-111111111111/moderate',
        'PUT /admin/users/bbbb3333-3333-4333-8333-333333333333/suspend',
      ]),
    );
  });
});
