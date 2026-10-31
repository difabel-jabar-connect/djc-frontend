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
  it('merender section berurutan: peta SIG, rute, penyedia unggulan, aksesibilitas', async () => {
    await renderHome();
    const titles = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    const order = [
      /peta sebaran layanan/i,
      /rute mudah menggunakan layanan/i,
      /penyedia layanan unggulan/i,
      /ramah & aksesibel untuk semua/i,
    ].map((name) => titles.findIndex((title) => name.test(title)));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(
      await screen.findByRole('region', { name: /peta sig penyedia layanan di jawa barat/i }),
    ).toBeInTheDocument();
  });

  it('hero hanya berisi tombol Cari Layanan (tanpa search bar & Daftar Mitra)', async () => {
    await renderHome();
    expect(screen.queryByRole('search', { name: /cari layanan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /daftar mitra/i })).not.toBeInTheDocument();
    const hero = screen.getByRole('region', { name: /temukan layanan terpercaya/i });
    expect(within(hero).getByRole('link', { name: 'Cari Layanan' })).toHaveAttribute(
      'href',
      '/services',
    );
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

  it('chip kategori populer mengarah ke pencarian terfilter', async () => {
    await renderHome();
    const chips = screen.getByRole('list', { name: /kategori populer/i });
    expect(within(chips).getByRole('link', { name: 'Terapi' })).toHaveAttribute(
      'href',
      '/services?kategori=terapi',
    );
  });

  it('kartu langkah menyorot titik pada ilustrasi rute (hover/fokus & klik)', async () => {
    const user = userEvent.setup();
    await renderHome();
    const steps = within(screen.getByRole('list', { name: 'Langkah menggunakan layanan' }));
    const pesan = steps.getByRole('button', { name: /langkah 2 pesan layanan/i });
    expect(pesan).toHaveAttribute('aria-controls', 'rute-peta');
    expect(screen.getByRole('img', { name: /ilustrasi rute/i })).toBeInTheDocument();

    await user.click(pesan);
    expect(pesan).toHaveAttribute('aria-pressed', 'true');
    expect(document.querySelector('.route-map__marker.is-active')).toHaveTextContent('02');
    await user.click(pesan);
    expect(pesan).toHaveAttribute('aria-pressed', 'false');
  });
});
