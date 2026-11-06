import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';
import { fakeApi } from '@/test/fakeApi';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 19, 9)); // Senin, 19 Oktober 2026
});

afterEach(() => vi.useRealTimers());

const providerName = (name) => screen.findByRole('heading', { level: 1, name });

describe('Halaman Profil Penyedia', () => {
  it('memuat profil dari GET /providers/:id: identitas, ringkasan, dan paket layanan', async () => {
    renderAt('/provider/siti-nurjanah');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Memuat profil');

    expect(await providerName('Siti Nurjanah')).toBeInTheDocument();
    expect(fakeApi.calls.some((call) => call.path === '/providers/siti-nurjanah')).toBe(true);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Jahit');
    const summary = screen.getByRole('complementary', { name: /ringkasan profil/i });
    expect(within(summary).getByText('Depok')).toBeInTheDocument();
    expect(within(summary).getByText('Rp30.000')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /pilih layanan/i })).toHaveLength(3);
    const nav = screen.getByRole('navigation', { name: /navigasi utama/i });
    expect(within(nav).getByRole('link', { name: 'Cari Layanan' })).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('memilih hari jadwal meneruskan tanggal ke pemesanan; hari libur nonaktif', async () => {
    const user = userEvent.setup();
    renderAt('/provider/siti-nurjanah');
    await providerName('Siti Nurjanah');
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
      '/pesan/siti-nurjanah?paket=siti-nurjanah--permak&tanggal=2026-10-21',
    );
  });

  it('ulasan publik belum tersedia di API → pesan pengganti', async () => {
    renderAt('/provider/fahri-hidayat');
    await providerName('Fahri Hidayat');
    expect(screen.getByText(/belum ada ulasan tertulis/i)).toBeInTheDocument();
  });

  it('id tidak dikenal (404) → halaman penyedia tidak ditemukan', async () => {
    renderAt('/provider/tidak-ada');
    expect(await providerName('Penyedia tidak ditemukan')).toBeInTheDocument();
  });

  it('server tidak bisa dihubungi → pesan gagal dan Coba Lagi memuat ulang', async () => {
    const user = userEvent.setup();
    fakeApi.offline = true;
    renderAt('/provider/siti-nurjanah');
    expect(await providerName('Profil penyedia belum bisa dimuat')).toBeInTheDocument();

    fakeApi.offline = false;
    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(await providerName('Siti Nurjanah')).toBeInTheDocument();
  });
});
