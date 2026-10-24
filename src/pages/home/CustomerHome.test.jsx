import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { renderAt } from '@/test/renderWithRouter';

const customer = { user: DEMO_ACCOUNTS.customer };

beforeEach(() => {
  // Beranda umum memanggil /health (ApiStatus); beranda pelanggan tidak.
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
});

describe('Beranda setelah pelanggan masuk', () => {
  it('menyapa pengguna dan menampilkan pesanan aktif dengan progres', () => {
    renderAt('/', customer);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Halo, Budi!Butuh layanan apa hari ini?',
    );
    expect(
      screen.getByRole('button', { name: /bandung, jawa barat · ubah lokasi/i }),
    ).toBeVisible();
    expect(screen.getByLabelText('Lokasi')).toHaveValue('Bandung');

    const active = within(screen.getByRole('region', { name: 'Pesanan Aktif' }));
    expect(active.getByText('Deni Setiawan')).toBeInTheDocument();
    expect(active.getByText('Sab, 24 Okt 2026 · 10.00–12.00')).toBeInTheDocument();
    const progress = active.getByRole('list', { name: 'Progres pesanan' });
    const current = within(progress)
      .getAllByRole('listitem')
      .find((step) => step.getAttribute('aria-current') === 'step');
    expect(current).toHaveTextContent('Dikonfirmasi');
    expect(active.getByRole('link', { name: 'Lihat detail pesanan BK-0011' })).toHaveAttribute(
      'href',
      '/bookings/BK-0011',
    );
    expect(
      active.getByRole('link', { name: /1 pesanan lain menunggu konfirmasi/i }),
    ).toHaveAttribute('href', '/bookings?status=menunggu');
  });

  it('tombol Ubah lokasi memindahkan fokus ke pilihan lokasi', async () => {
    const user = userEvent.setup();
    renderAt('/', customer);
    await user.click(screen.getByRole('button', { name: /ubah lokasi/i }));
    expect(screen.getByLabelText('Lokasi')).toHaveFocus();

    await user.selectOptions(screen.getByLabelText('Lokasi'), 'Bogor');
    expect(screen.getByRole('button', { name: /bogor, jawa barat · ubah lokasi/i })).toBeVisible();
  });

  it('penyedia terdekat menampilkan jarak & kecamatan, dan bisa disimpan ke favorit', async () => {
    const user = userEvent.setup();
    renderAt('/', customer);
    const nearby = within(screen.getByRole('region', { name: 'Penyedia Terdekat dari Anda' }));

    expect(nearby.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Rizki Maulana',
      'Agus Setiawan',
      'Rina Agustina',
    ]);
    expect(nearby.getByText('1,2 km dari Anda')).toBeInTheDocument();
    expect(nearby.getByText('Sukajadi, Bandung')).toBeInTheDocument();

    const heart = nearby.getByRole('button', { name: 'Simpan Rina Agustina ke favorit' });
    expect(heart).toHaveAttribute('aria-pressed', 'false');
    await user.click(heart);
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(localStorage.getItem('djc.favorites'))).toEqual(['rina-agustina']);
  });

  it('aktivitas: pesan lagi & ulasan cepat membuka form ulasan dengan bintang terpilih', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/', customer);
    const reorder = within(screen.getByRole('region', { name: 'Pesan Lagi' }));
    expect(reorder.getAllByRole('link').map((link) => link.getAttribute('aria-label'))).toEqual([
      'Pesan lagi Jahit & Permak Pakaian dari Siti Nurjanah',
      'Pesan lagi Layanan Kebersihan Rumah dari Rizki Maulana',
      'Pesan lagi Servis Elektronik dari Deni Setiawan',
    ]);

    const review = within(screen.getByRole('region', { name: 'Beri Ulasan' }));
    expect(review.getByText(/selesai 19 okt 2026/i)).toBeInTheDocument();
    await user.click(review.getByRole('radio', { name: '4 bintang' }));
    await user.click(review.getByRole('button', { name: 'Tulis Ulasan' }));

    expect(router.state.location.pathname).toBe('/bookings/BK-0009');
    const dialog = await screen.findByRole('dialog', { name: 'Beri Ulasan' });
    expect(within(dialog).getByRole('radio', { name: '4 bintang, Baik' })).toBeChecked();
  });

  it('peta menampilkan lokasi pengguna dan radius', () => {
    renderAt('/', customer);
    expect(screen.getByRole('img', { name: /lokasi anda: bandung/i })).toBeInTheDocument();
    expect(screen.getByText('Radius ±5 km')).toBeInTheDocument();
  });
});

describe('Header setelah masuk', () => {
  it('menampilkan Pesanan Saya, notifikasi, dan menu akun', async () => {
    const user = userEvent.setup();
    renderAt('/', customer);
    const nav = within(screen.getByRole('navigation', { name: /navigasi utama/i }));
    expect(nav.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Beranda',
      'Cari Layanan',
      'Pesanan Saya',
      'Tentang',
    ]);
    expect(screen.queryByRole('link', { name: 'Masuk' })).not.toBeInTheDocument();

    const bell = screen.getByRole('button', { name: 'Notifikasi, 2 belum dibaca' });
    await user.click(bell);
    expect(bell).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('link', { name: /deni setiawan menerima pesanan anda/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /BK-0011/ })).toBeVisible();
    // Notifikasi pesanan yang sudah dibuka tidak dihitung lagi.
    expect(screen.getByRole('button', { name: 'Notifikasi, 1 belum dibaca' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Pesanan Saya' })).toHaveAttribute('aria-current', 'page');
  });

  it('Keluar mengakhiri sesi dan kembali ke beranda umum', async () => {
    const user = userEvent.setup();
    renderAt('/bookings', customer);

    await user.click(screen.getByRole('button', { name: 'Menu akun Budi Santoso' }));
    await user.click(screen.getByRole('button', { name: 'Keluar' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: /temukan layanan terpercaya/i }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Masuk' })).toBeInTheDocument();
  });
});
