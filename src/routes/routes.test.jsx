import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

const mockHealthOk = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { status: 'ok' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );

describe('Routing dasar', () => {
  beforeEach(mockHealthOk);

  it('menampilkan beranda beserta status API (mode development)', async () => {
    renderAt('/');
    expect(
      screen.getByRole('heading', { level: 1, name: /temukan layanan terpercaya/i }),
    ).toBeVisible();
    expect(await screen.findByText(/terhubung ke backend/i)).toBeInTheDocument();
  });

  it.each([
    ['/services', /cari layanan/i],
    ['/map', /peta penyedia jasa/i],
    ['/tentang', /menghubungkan keterampilan/i],
    ['/provider/siti-nurjanah', /siti nurjanah/i],
    ['/provider/tidak-ada', /penyedia tidak ditemukan/i],
    ['/login', /selamat datang kembali/i],
    ['/lupa-kata-sandi', /lupa kata sandi/i],
    ['/lupa-kata-sandi/cek-email', /cek email anda/i],
    ['/reset-kata-sandi?token=abc', /atur ulang kata sandi/i],
    ['/reset-kata-sandi/berhasil', /kata sandi berhasil diubah/i],
    ['/register', /mulai terhubung bersama kami/i],
    // Halaman pelanggan: belum masuk → diarahkan ke halaman Masuk.
    ['/bookings', /selamat datang kembali/i],
    ['/pesan/rizki-maulana', /selamat datang kembali/i],
    ['/dashboard/provider', /selamat datang/i],
    ['/admin', /dashboard monitoring program/i],
  ])('rute %s merender halaman placeholder', (path, heading) => {
    renderAt(path);
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });

  it('menampilkan halaman 404 untuk rute tidak dikenal', () => {
    renderAt('/tidak-ada');
    expect(screen.getByRole('heading', { name: /halaman tidak ditemukan/i })).toBeInTheDocument();
  });

  it('navigasi utama berpindah halaman', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: /navigasi utama/i });
    await user.click(within(nav).getByRole('link', { name: 'Tentang' }));
    expect(
      screen.getByRole('heading', { level: 1, name: /menghubungkan keterampilan/i }),
    ).toBeVisible();
    expect(within(nav).getByRole('link', { name: 'Tentang' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

describe('Aksesibilitas layout', () => {
  beforeEach(mockHealthOk);

  it('menyediakan skip link, landmark navigasi, dan main', () => {
    renderAt('/services');
    expect(screen.getByRole('link', { name: /lewati ke konten utama/i })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('navigation', { name: /navigasi utama/i })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('memindahkan fokus ke konten utama setelah pindah rute', async () => {
    const user = userEvent.setup();
    renderAt('/');
    const nav = screen.getByRole('navigation', { name: /navigasi utama/i });
    await user.click(within(nav).getByRole('link', { name: 'Cari Layanan' }));
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
