import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { status: 'ok' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
});

// Tunggu panel status API (dev) selesai memuat agar tidak ada update state di luar act().
async function renderHome() {
  const result = renderAt('/');
  await screen.findByText(/terhubung ke backend/i);
  return result;
}

describe('Beranda', () => {
  it('merender seluruh section sesuai desain', async () => {
    await renderHome();
    [
      /penyedia layanan unggulan/i,
      /peta sebaran layanan/i,
      /mudah dalam 3 langkah/i,
      /ramah & aksesibel untuk semua/i,
    ].forEach((name) => {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    });
    expect(
      screen.getByRole('img', { name: /peta jawa barat dengan titik layanan di bekasi/i }),
    ).toBeInTheDocument();
  });

  it('menampilkan kartu penyedia dengan tautan beraksesibel', async () => {
    await renderHome();
    const card = screen
      .getByRole('heading', { level: 3, name: 'Rizki Maulana' })
      .closest('article');
    expect(within(card).getByText('Rp50.000')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Lihat profil Rizki Maulana' })).toHaveAttribute(
      'href',
      '/provider/rizki-maulana',
    );
    expect(
      within(card).getByRole('link', { name: 'Pesan sekarang ke Rizki Maulana' }),
    ).toBeInTheDocument();
  });

  it('form pencarian membawa kata kunci & lokasi ke halaman Cari Layanan', async () => {
    const user = userEvent.setup();
    const { router } = await renderHome();
    const search = screen.getByRole('search', { name: /cari layanan/i });

    await user.type(within(search).getByLabelText(/kata kunci/i), 'jahit');
    await user.selectOptions(within(search).getByLabelText('Lokasi'), 'Bandung');
    await user.click(within(search).getByRole('button', { name: /cari layanan/i }));

    expect(router.state.location.pathname).toBe('/services');
    expect(router.state.location.search).toBe('?q=jahit&lokasi=Bandung');
  });

  it('chip kategori populer mengarah ke pencarian terfilter', async () => {
    await renderHome();
    const chips = screen.getByRole('list', { name: /kategori populer/i });
    expect(within(chips).getByRole('link', { name: 'Terapi' })).toHaveAttribute(
      'href',
      '/services?kategori=terapi',
    );
  });
});
