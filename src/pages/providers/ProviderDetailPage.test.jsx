import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 19, 9)); // Senin, 19 Oktober 2026
});

afterEach(() => vi.useRealTimers());

describe('Halaman Profil Penyedia', () => {
  it('menampilkan identitas, ringkasan, paket, dan ulasan', () => {
    renderAt('/provider/siti-nurjanah');
    expect(screen.getByRole('heading', { level: 1, name: 'Siti Nurjanah' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'Jahit & Permak Pakaian',
    );
    const summary = screen.getByRole('complementary', { name: /ringkasan profil/i });
    expect(within(summary).getByText('Depok, Jakarta Selatan, Tangerang')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /pilih layanan/i })).toHaveLength(3);
    expect(screen.getAllByRole('img', { name: /rating \d dari 5/i })).toHaveLength(3);
    const nav = screen.getByRole('navigation', { name: /navigasi utama/i });
    expect(within(nav).getByRole('link', { name: 'Cari Layanan' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('memilih hari jadwal meneruskan tanggal ke pemesanan; hari libur nonaktif', async () => {
    const user = userEvent.setup();
    renderAt('/provider/siti-nurjanah');
    const days = screen.getByRole('group', { name: /pilih hari layanan/i });
    expect(
      within(days).getByRole('button', { name: /min 25 okt, tidak tersedia/i }),
    ).toBeDisabled();

    await user.click(within(days).getByRole('button', { name: /rab/i }));
    expect(within(days).getByRole('button', { name: /rab/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('link', { name: /pesan sekarang/i })).toHaveAttribute(
      'href',
      '/pesan/siti-nurjanah?tanggal=2026-10-21',
    );
    expect(screen.getByRole('link', { name: 'Pilih layanan Permak Pakaian' })).toHaveAttribute(
      'href',
      '/pesan/siti-nurjanah?paket=permak&tanggal=2026-10-21',
    );
  });

  it('penyedia tanpa ulasan tertulis menampilkan pesan pengganti', () => {
    renderAt('/provider/fahri-hidayat');
    expect(screen.getByText(/belum ada ulasan tertulis/i)).toBeInTheDocument();
  });
});
