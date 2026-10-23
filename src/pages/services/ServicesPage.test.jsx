import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const resultCount = () => screen.getByRole('heading', { level: 2, name: /ditemukan/i });
const cardNames = () =>
  screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);

describe('Halaman Cari Layanan', () => {
  it('menampilkan seluruh penyedia beserta sidebar', () => {
    renderAt('/services');
    expect(screen.getByRole('heading', { level: 1, name: 'Cari Layanan' })).toBeInTheDocument();
    expect(resultCount()).toHaveTextContent('Ditemukan 6 penyedia layanan');
    expect(
      screen.getByRole('img', { name: /peta jumlah penyedia: bandung 32/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/filter aktif:/i)).toHaveTextContent('tidak ada');
  });

  it('membaca filter dari URL (tautan chip kategori di Beranda)', () => {
    renderAt('/services?kategori=jahit&lokasi=Depok');
    expect(cardNames()).toEqual(['Siti Nurjanah']);
    expect(screen.getByRole('button', { name: 'Jahit' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Lokasi Kota')).toHaveValue('Depok');
    expect(screen.getByText(/filter aktif:/i)).toHaveTextContent('Jahit, Depok');
  });

  it('chip kategori & dropdown memfilter hasil dan memperbarui URL', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/services');

    await user.click(screen.getByRole('button', { name: 'Kuliner' }));
    expect(cardNames()).toEqual(['Lina Kurnia']);
    expect(router.state.location.search).toBe('?kategori=kuliner');

    await user.click(screen.getByRole('button', { name: 'Semua' }));
    await user.selectOptions(screen.getByLabelText('Harga'), 'gt100');
    expect(resultCount()).toHaveTextContent('Ditemukan 0 penyedia layanan');
    expect(screen.getByText(/belum ada layanan yang cocok/i)).toBeInTheDocument();
  });

  it('kata kunci, urutan, dan reset filter', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/services');
    const search = screen.getByRole('search', { name: /cari dan saring layanan/i });

    await user.type(within(search).getByLabelText(/kata kunci/i), 'bandung');
    await user.click(within(search).getByRole('button', { name: 'Cari' }));
    expect(cardNames()).toEqual(['Rizki Maulana', 'Agus Setiawan']);

    await user.selectOptions(screen.getByLabelText('Urutkan:'), 'harga');
    expect(cardNames()).toEqual(['Rizki Maulana', 'Agus Setiawan']);
    expect(router.state.location.search).toBe('?q=bandung&urut=harga');

    await user.click(within(search).getByRole('button', { name: 'Reset Filter' }));
    expect(resultCount()).toHaveTextContent('Ditemukan 6 penyedia layanan');
    expect(within(search).getByLabelText(/kata kunci/i)).toHaveValue('');
    expect(router.state.location.search).toBe('?urut=harga');
  });

  it('kartu hasil memiliki tautan profil & pesan beraksesibel', () => {
    renderAt('/services');
    const card = screen
      .getByRole('heading', { level: 3, name: 'Agus Setiawan' })
      .closest('article');
    expect(within(card).getByText('Desain Grafis')).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: 'Lihat profil Agus Setiawan' })).toHaveAttribute(
      'href',
      '/provider/agus-setiawan',
    );
    expect(
      within(card).getByRole('link', { name: 'Pesan layanan Agus Setiawan' }),
    ).toBeInTheDocument();
  });
});
