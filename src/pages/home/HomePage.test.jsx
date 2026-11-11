import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

// Tunggu panel status API (dev) & data penyedia (backend tiruan) selesai dimuat.
async function renderHome() {
  const result = renderAt('/');
  await screen.findByText(/terhubung ke backend/i);
  await screen.findByText(/alumni kuliner di peta/i);
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
    const hero = screen.getByRole('region', { name: /jasa alumni difabel jabar/i });
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
    expect(within(card).getByText(/rp50\.000 per jam/i)).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Lihat profil Rizki Maulana' })).toHaveAttribute(
      'href',
      '/provider/rizki-maulana',
    );
    expect(
      within(card).getByRole('link', { name: 'Pesan sekarang ke Rizki Maulana' }),
    ).toBeInTheDocument();
  });

  it('pilih keahlian di hero menampilkan pin harga alumni di peta Jawa Barat', async () => {
    const user = userEvent.setup();
    await renderHome();
    const picker = within(screen.getByRole('group', { name: 'Lihat alumni di peta' }));
    expect(picker.getByRole('radio', { name: 'Kuliner' })).toBeChecked();
    expect(picker.getByText(/5 alumni kuliner di peta/i)).toBeInTheDocument();
    expect(document.querySelectorAll('.hero-motif .topo__pin')).toHaveLength(5);

    await user.click(picker.getByRole('radio', { name: 'Terapi Pijat' }));
    expect(picker.getByText(/2 alumni terapi pijat di peta/i)).toBeInTheDocument();
    expect(picker.getByRole('link', { name: /lihat semua/i })).toHaveAttribute(
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

  it('tombol "Cara memesan" menuju rute dan tetap biru setelah diklik', async () => {
    const user = userEvent.setup();
    await renderHome();
    const how = screen.getByRole('link', { name: 'Cara memesan' });
    expect(how).toHaveAttribute('href', '#cara-pesan');
    expect(how).not.toHaveClass('is-active');

    await user.click(how);
    expect(how).toHaveClass('is-active');
  });
});
