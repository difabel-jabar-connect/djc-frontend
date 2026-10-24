import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { renderAt } from '@/test/renderWithRouter';

const customer = { user: DEMO_ACCOUNTS.customer };
const bookingList = () => screen.getByRole('list', { name: /daftar pesanan/i });
const cardLinks = () =>
  within(bookingList())
    .getAllByRole('heading', { level: 2 })
    .map((heading) => within(heading).getByRole('link'));

describe('Halaman Pesanan Saya', () => {
  it('meminta masuk dulu bila belum login, lalu kembali ke halaman ini', () => {
    const { router } = renderAt('/bookings?status=selesai');
    expect(
      screen.getByRole('heading', { level: 1, name: /selamat datang kembali/i }),
    ).toBeVisible();
    expect(router.state.location.search).toBe('?next=%2Fbookings%3Fstatus%3Dselesai');
  });

  it('menampilkan tab status beserta jumlah dan 5 pesanan pertama', () => {
    renderAt('/bookings', customer);
    expect(screen.getByRole('heading', { level: 1, name: 'Pesanan Saya' })).toBeVisible();

    const tabs = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(tabs).toEqual([
      'Semua, 8 pesanan',
      'Menunggu, 1 pesanan',
      'Diterima, 1 pesanan',
      'Berjalan, 1 pesanan',
      'Selesai, 3 pesanan',
      'Dibatalkan/Ditolak, 2 pesanan',
    ]);
    expect(screen.getByRole('tab', { name: /^semua/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(/^semua/i);

    expect(bookingList()).toHaveAccessibleName('Daftar pesanan, 5 dari 8 ditampilkan');
    expect(cardLinks().map((link) => link.textContent)).toEqual([
      'Layanan Kebersihan Rumah, BK-0012, status Menunggu',
      'Servis Elektronik, BK-0011, status Diterima',
      'Desain Grafis, BK-0010, status Berjalan',
      'Jahit & Permak Pakaian, BK-0009, status Selesai',
      'Kue & Kuliner Rumahan, BK-0008, status Dibatalkan',
    ]);
    expect(screen.getByText(/batal otomatis dalam/i)).toHaveTextContent('18 jam');
    expect(screen.getByText('Sel, 27 Okt 2026 · 09.00 WIB')).toBeInTheDocument();
    expect(screen.getByText('Estimasi Rp105.000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Beri ulasan untuk Siti Nurjanah' })).toHaveAttribute(
      'href',
      '/bookings/BK-0009?ulasan=tulis',
    );
  });

  it('Muat lebih banyak menampilkan sisa pesanan dan memindahkan fokus ke item baru', async () => {
    const user = userEvent.setup();
    renderAt('/bookings', customer);

    await user.click(screen.getByRole('button', { name: /muat lebih banyak/i }));
    expect(bookingList()).toHaveAccessibleName('Daftar pesanan, 8 dari 8 ditampilkan');
    expect(cardLinks()[5]).toHaveFocus();
    expect(screen.queryByRole('button', { name: /muat lebih banyak/i })).not.toBeInTheDocument();
    expect(screen.getByText('Menampilkan 8 dari 8 pesanan')).toBeInTheDocument();
  });

  it('tab bisa dipilih dengan panah kiri/kanan dan tersimpan di URL', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/bookings', customer);

    screen.getByRole('tab', { name: /^semua/i }).focus();
    await user.keyboard('{ArrowLeft}');
    const batal = screen.getByRole('tab', { name: /^dibatalkan\/ditolak/i });
    expect(batal).toHaveFocus();
    expect(batal).toHaveAttribute('aria-selected', 'true');
    expect(batal).toHaveAttribute('tabindex', '0');
    expect(router.state.location.search).toBe('?status=batal');
    expect(cardLinks().map((link) => link.textContent)).toEqual([
      'Kue & Kuliner Rumahan, BK-0008, status Dibatalkan',
      'Terapi Pijat, BK-0005, status Ditolak',
    ]);

    await user.keyboard('{Home}{ArrowRight}');
    expect(screen.getByRole('tab', { name: /^menunggu/i })).toHaveFocus();
    expect(router.state.location.search).toBe('?status=menunggu');
    expect(cardLinks()).toHaveLength(1);
  });

  it('membaca filter dari URL', () => {
    renderAt('/bookings?status=selesai', customer);
    expect(screen.getByRole('tab', { name: /^selesai/i })).toHaveAttribute('aria-selected', 'true');
    expect(cardLinks()).toHaveLength(3);
    expect(screen.getAllByRole('link', { name: /^beri ulasan/i })).toHaveLength(1);
  });
});
