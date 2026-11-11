import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';
import { fakeApi } from '@/test/fakeApi';

/** Tunggu hasil dari backend (tiruan) selesai dimuat. */
const loaded = () => screen.findByRole('heading', { level: 2, name: /ditemukan/i });
const cardNames = () =>
  screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
const searchCalls = () => fakeApi.calls.filter((call) => call.path === '/services');
const lastQuery = () => new URLSearchParams(searchCalls().at(-1).search);

describe('Halaman Cari Layanan', () => {
  it('memuat penyedia dari GET /services beserta sidebar dan peta SIG', async () => {
    renderAt('/services');
    expect(screen.getByRole('heading', { level: 1, name: 'Cari Layanan' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: /mencari penyedia/i }),
    ).toBeInTheDocument();

    expect(await loaded()).toHaveTextContent('Ditemukan 19 penyedia layanan');
    expect(lastQuery().get('sort')).toBe('newest');
    expect(screen.getByText(/filter aktif:/i)).toHaveTextContent('tidak ada');
    expect(
      await screen.findByRole('region', { name: /peta sig penyedia layanan di jawa barat/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('19 penyedia di peta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tampilkan peta' })).toBeInTheDocument();
  });

  it('membaca filter dari URL: kategori ke backend, kota disaring di klien', async () => {
    renderAt('/services?kategori=jahit&lokasi=Depok');
    await loaded();
    expect(cardNames()).toEqual(['Siti Nurjanah']);
    expect(lastQuery().get('category')).toBe('jahit');
    expect(lastQuery().has('city')).toBe(false);
    expect(screen.getByRole('button', { name: 'Jahit' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Lokasi Kota')).toHaveValue('Depok');
    expect(screen.getByText(/filter aktif:/i)).toHaveTextContent('Jahit, Depok');
  });

  it('chip kategori & dropdown meminta ulang ke backend dan memperbarui URL', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/services');
    await loaded();

    await user.click(screen.getByRole('button', { name: 'Kuliner' }));
    await loaded();
    expect(cardNames()).toEqual([
      'Lina Kurnia',
      'Rina Agustina',
      'Hana Safitri',
      'Eka Pratiwi',
      'Asep Sunandar',
    ]);
    expect(router.state.location.search).toBe('?kategori=kuliner');

    await user.click(screen.getByRole('button', { name: 'Semua' }));
    await user.selectOptions(screen.getByLabelText('Harga'), 'gt100');
    expect(await loaded()).toHaveTextContent('Ditemukan 1 penyedia layanan');
    expect(lastQuery().get('min_price')).toBe('100001');

    await user.selectOptions(screen.getByLabelText('Ketersediaan Hari'), '0');
    await loaded();
    expect(lastQuery().get('day_of_week')).toBe('0');

    await user.click(screen.getByRole('button', { name: 'Jahit' }));
    expect(await loaded()).toHaveTextContent('Ditemukan 0 penyedia layanan');
    expect(screen.getByText(/belum ada layanan yang cocok/i)).toBeInTheDocument();
  });

  it('kata kunci, urutan, dan reset filter', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/services');
    await loaded();
    const search = screen.getByRole('search', { name: /cari dan saring layanan/i });

    await user.type(within(search).getByLabelText(/kata kunci/i), 'kue');
    await user.click(within(search).getByRole('button', { name: 'Cari' }));
    await loaded();
    expect(lastQuery().get('q')).toBe('kue');
    const byKeyword = cardNames();
    expect(byKeyword.length).toBeGreaterThan(0);

    await user.selectOptions(screen.getByLabelText('Urutkan:'), 'harga');
    await loaded();
    expect(lastQuery().get('sort')).toBe('price_asc');
    expect(router.state.location.search).toBe('?q=kue&urut=harga');

    await user.click(within(search).getByRole('button', { name: 'Reset Filter' }));
    expect(await loaded()).toHaveTextContent('Ditemukan 19 penyedia layanan');
    expect(within(search).getByLabelText(/kata kunci/i)).toHaveValue('');
    expect(router.state.location.search).toBe('?urut=harga');
  });

  it('kartu hasil memiliki tautan profil & pesan beraksesibel', async () => {
    renderAt('/services');
    const card = (await screen.findByRole('heading', { level: 3, name: 'Agus Setiawan' })).closest(
      'article',
    );
    expect(within(card).getByText('Desain Grafis')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Lihat profil Agus Setiawan' })).toHaveAttribute(
      'href',
      '/provider/agus-setiawan',
    );
    expect(
      within(card).getByRole('link', { name: 'Pesan layanan Agus Setiawan' }),
    ).toBeInTheDocument();
  });

  it('server tidak bisa dihubungi → pesan gagal dan tombol Coba Lagi', async () => {
    const user = userEvent.setup();
    fakeApi.offline = true;
    renderAt('/services');
    expect(await screen.findByRole('alert')).toHaveTextContent(/tidak dapat terhubung ke server/i);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Hasil belum bisa dimuat' }),
    ).toBeInTheDocument();

    fakeApi.offline = false;
    await user.click(screen.getByRole('button', { name: 'Coba Lagi' }));
    expect(await loaded()).toHaveTextContent('Ditemukan 19 penyedia layanan');
  });
});
