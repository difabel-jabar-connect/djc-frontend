import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

describe('Dashboard Admin', () => {
  it('menampilkan sapaan, ringkasan, antrean, aktivitas, dan grafik beraksesibel', () => {
    renderAt('/admin');
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
      '/admin/verifikasi?tinjau=v-rudi',
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
    renderAt('/admin');
    await user.selectOptions(screen.getByLabelText('Rentang waktu'), '7');
    expect(screen.getByText(/total 7 hari/i)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /pesanan harian 21 okt 2026 sampai 27 okt 2026/i }),
    ).toBeInTheDocument();
  });

  it('sidebar menandai halaman aktif dan berpindah ke halaman admin lain', async () => {
    const user = userEvent.setup();
    renderAt('/admin');
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
    renderAt('/admin');
    const button = screen.getByRole('button', { name: /andi pratama/i });
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });
});
