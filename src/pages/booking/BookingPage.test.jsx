import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 19, 9)); // Senin, 19 Oktober 2026
});

afterEach(() => vi.useRealTimers());

const summary = () => screen.getByRole('region', { name: /ringkasan pesanan/i });

describe('Halaman Pemesanan', () => {
  it('menolak konfirmasi bila isian wajib kosong dan menampilkan ringkasan error', async () => {
    const user = userEvent.setup();
    renderAt('/pesan/rizki-maulana');
    await user.click(screen.getByRole('button', { name: /konfirmasi pesanan/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Periksa kembali 3 isian berikut');
    expect(within(alert).getByRole('link', { name: 'Pilih tanggal layanan.' })).toHaveAttribute(
      'href',
      '#booking-date',
    );
    expect(screen.getByLabelText(/alamat lengkap/i)).toHaveAttribute('aria-invalid', 'true');
  });

  it('alur lengkap: tanggal, slot, alamat → total harga & pesanan berhasil', async () => {
    const user = userEvent.setup();
    renderAt('/pesan/rizki-maulana');
    expect(screen.getByRole('navigation', { name: /langkah pemesanan/i })).toHaveTextContent(
      'JadwalSedang diisi',
    );

    await user.click(screen.getByRole('button', { name: /selasa, 20 oktober 2026/i }));
    await user.click(screen.getByRole('button', { name: '09.00' }));
    await user.click(screen.getByRole('button', { name: '10.00' }));
    expect(screen.getByRole('button', { name: '13.00, penuh' })).toBeDisabled();
    expect(screen.getByText(/terpilih:/i)).toHaveTextContent('09.00–11.00 (2 jam)');

    await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Cigadung Raya No. 12');
    await user.click(screen.getByRole('radio', { name: /e-wallet/i }));

    expect(within(summary()).getByText('Biaya Layanan (2 jam)')).toBeInTheDocument();
    expect(within(summary()).getByText('Rp105.000')).toBeInTheDocument();
    expect(within(summary()).getByText('Selasa, 20 Oktober 2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /konfirmasi pesanan/i }));
    expect(screen.getByRole('heading', { name: /pesanan berhasil dibuat/i })).toBeInTheDocument();
  });

  it('membaca paket & tanggal dari query (tautan profil penyedia)', () => {
    renderAt('/pesan/siti-nurjanah?paket=busana-muslim&tanggal=2026-10-21');
    expect(within(summary()).getByText('Jahit Busana Muslim')).toBeInTheDocument();
    expect(within(summary()).getByText('Rabu, 21 Oktober 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /minggu, 25 oktober 2026, libur/i })).toBeDisabled();
  });

  it('menghitung karakter catatan', async () => {
    const user = userEvent.setup();
    renderAt('/pesan/rizki-maulana');
    await user.type(screen.getByLabelText(/catatan untuk penyedia/i), 'Ada kucing');
    expect(screen.getByText('10/300 karakter')).toBeInTheDocument();
  });
});
