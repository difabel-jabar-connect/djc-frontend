import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

const mockHealthOk = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );

describe('Routing dasar', () => {
  beforeEach(mockHealthOk);

  it('menampilkan beranda beserta status API', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: /difabel jabar connect/i })).toBeVisible();
    expect(await screen.findByText(/terhubung ke backend/i)).toBeInTheDocument();
  });

  it.each([
    ['/services', /cari layanan/i],
    ['/map', /peta penyedia jasa/i],
    ['/provider/abc-123', /profil penyedia jasa/i],
    ['/login', /masuk/i],
    ['/register', /daftar akun customer/i],
    ['/bookings', /pesanan saya/i],
    ['/dashboard/provider', /dasbor penyedia jasa/i],
    ['/admin', /dasbor administrator/i],
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
    await user.click(screen.getByRole('link', { name: 'Peta Penyedia' }));
    expect(screen.getByRole('heading', { level: 1, name: /peta penyedia jasa/i })).toBeVisible();
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
    await user.click(screen.getByRole('link', { name: 'Cari Layanan' }));
    expect(screen.getByRole('main')).toHaveFocus();
  });
});
