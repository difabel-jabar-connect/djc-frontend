import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 19, 9)); // Senin, 19 Oktober 2026 pukul 09.00
});

afterEach(() => vi.useRealTimers());

const ordersTable = () => within(screen.getByRole('region', { name: /pesanan masuk/i }));

describe('Dashboard Penyedia', () => {
  it('menampilkan sambutan, statistik, dan menu dengan jumlah pesanan baru', () => {
    renderAt('/dashboard/provider');
    expect(
      screen.getByRole('heading', { level: 1, name: /selamat datang, deni setiawan/i }),
    ).toBeVisible();
    expect(screen.queryByRole('navigation', { name: /navigasi utama/i })).not.toBeInTheDocument();
    const nav = screen.getByRole('navigation', { name: /menu penyedia/i });
    expect(within(nav).getByRole('link', { name: 'Pesanan Masuk, 2 baru' })).toHaveAttribute(
      'href',
      '#pesanan',
    );
    expect(within(nav).getByRole('link', { name: /profil saya/i })).toHaveAttribute(
      'href',
      '/provider/deni-setiawan',
    );
    expect(screen.getByRole('link', { name: 'Notifikasi, 4 belum dibaca' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /kelengkapan profil/i })).toHaveAttribute(
      'aria-valuenow',
      '85',
    );
  });

  it('menerima pesanan baru dan menampilkan detail pesanan', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard/provider');

    await user.click(ordersTable().getByRole('button', { name: 'Terima pesanan Siti Nurjanah' }));
    expect(screen.getByText(/pesanan siti nurjanah kini berstatus diproses/i)).toBeInTheDocument();
    expect(
      ordersTable().getByRole('button', { name: 'Selesai pesanan Siti Nurjanah' }),
    ).toBeInTheDocument();

    const lihat = ordersTable().getByRole('button', { name: 'Lihat pesanan Siti Nurjanah' });
    await user.click(lihat);
    expect(lihat).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Jl. Margonda Raya No. 21, Depok')).toBeVisible();
  });

  it('jadwal mingguan: agenda hari terpilih & navigasi minggu', async () => {
    const user = userEvent.setup();
    renderAt('/dashboard/provider');
    const schedule = within(screen.getByRole('region', { name: /jadwal minggu ini/i }));

    expect(schedule.getByText('19 – 25 Oktober 2026')).toBeInTheDocument();
    expect(
      schedule.getByRole('button', { name: /senin 19 okt, hari ini, ada jadwal/i }),
    ).toHaveAttribute('aria-current', 'date');
    expect(schedule.getByText('Servis TV')).toBeInTheDocument();

    await user.click(schedule.getByRole('button', { name: /selasa 20 okt/i }));
    expect(schedule.getByText('Servis Kipas Angin')).toBeInTheDocument();

    await user.click(schedule.getByRole('button', { name: 'Minggu berikutnya' }));
    expect(schedule.getByText('26 Oktober – 1 November 2026')).toBeInTheDocument();
    expect(schedule.getByText(/tidak ada jadwal/i)).toBeInTheDocument();
  });

  it('tombol Keluar memanggil API logout lalu kembali ke halaman Masuk', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/dashboard/provider');

    const nav = screen.getByRole('navigation', { name: /menu penyedia/i });
    await user.click(within(nav).getByRole('button', { name: 'Keluar' }));
    expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/api/v1/auth/logout');
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});
