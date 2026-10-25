import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { renderAt } from '@/test/renderWithRouter';

const customer = { user: DEMO_ACCOUNTS.customer };

describe('Halaman Detail Pesanan', () => {
  it('pesanan diterima: banner status, rincian, riwayat, dan kontak terbuka', () => {
    renderAt('/bookings/BK-0011', customer);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Detail pesanan BK-0011');
    expect(screen.getByLabelText('Status pesanan')).toHaveTextContent(
      'Penyedia menerima pesanan Anda',
    );
    expect(screen.getByText('Sabtu, 24 Oktober 2026 · 10.00 WIB')).toBeInTheDocument();
    expect(screen.getByText('Rp60.000 / jam')).toBeInTheDocument();
    expect(screen.getByText('Rp120.000')).toBeInTheDocument();

    const history = within(screen.getByRole('region', { name: 'Riwayat Status' }));
    const items = history.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/diterima.*oleh penyedia.*terbaru/i);
    expect(items[1]).toHaveTextContent(/pesanan dibuat · menunggu respons.*oleh anda/i);

    const contact = within(screen.getByRole('region', { name: 'Kontak & Lokasi' }));
    expect(contact.getByText('0812-3456-7890')).toBeInTheDocument();
    expect(
      contact.getByRole('link', { name: /hubungi deni setiawan via whatsapp/i }),
    ).toHaveAttribute('href', 'https://wa.me/6281234567890');
  });

  it('membatalkan pesanan: alasan wajib, penghitung karakter, lalu status berubah', async () => {
    const user = userEvent.setup();
    renderAt('/bookings/BK-0011', customer);

    await user.click(screen.getByRole('button', { name: 'Batalkan pesanan BK-0011' }));
    const dialog = screen.getByRole('dialog', { name: 'Batalkan pesanan?' });
    expect(dialog).toHaveAccessibleDescription(/BK-0011 · Servis Elektronik/);

    await user.click(within(dialog).getByRole('button', { name: 'Ya, Batalkan' }));
    const reason = within(dialog).getByLabelText(/alasan pembatalan/i);
    expect(reason).toHaveFocus();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(within(dialog).getByText(/tuliskan alasan pembatalan/i)).toBeInTheDocument();

    await user.type(reason, 'Jadwal saya berubah.');
    expect(within(dialog).getByText('20/200 karakter')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Ya, Batalkan' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Pesanan BK-0011 berhasil dibatalkan');
    expect(screen.getByRole('status')).toHaveFocus();
    expect(screen.getByLabelText('Status pesanan')).toHaveTextContent('Jadwal saya berubah.');
    expect(screen.queryByRole('button', { name: /batalkan pesanan/i })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Kontak & Lokasi' })).toHaveTextContent(/terkunci/i);
  });

  it('tombol Kembali menutup dialog tanpa membatalkan', async () => {
    const user = userEvent.setup();
    renderAt('/bookings/BK-0012', customer);
    const trigger = screen.getByRole('button', { name: 'Batalkan pesanan BK-0012' });

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Kembali' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(screen.getByLabelText('Status pesanan')).toHaveTextContent('Menunggu respons penyedia');
  });

  it('memberi ulasan: bintang wajib, bisa dengan panah, lalu terkirim', async () => {
    const user = userEvent.setup();
    renderAt('/bookings/BK-0009', customer);
    expect(screen.getByRole('region', { name: 'Kontak & Lokasi' })).toHaveTextContent(
      /ditutup kembali setelah layanan selesai/i,
    );

    await user.click(screen.getByRole('button', { name: 'Beri ulasan untuk Siti Nurjanah' }));
    const dialog = screen.getByRole('dialog', { name: 'Beri Ulasan' });
    const submit = within(dialog).getByRole('button', { name: 'Kirim Ulasan' });
    expect(submit).toBeDisabled();
    expect(within(dialog).getByText('Pilih jumlah bintang')).toBeInTheDocument();

    const stars = within(dialog).getByRole('radiogroup', { name: /penilaian anda/i });
    await user.click(within(stars).getByRole('radio', { name: '3 bintang, Cukup' }));
    await user.keyboard('{ArrowRight}');
    const four = within(stars).getByRole('radio', { name: '4 bintang, Baik' });
    expect(four).toHaveAttribute('aria-checked', 'true');
    expect(four).toHaveFocus();
    expect(within(dialog).getByText('4 · Baik')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText(/ceritakan pengalaman/i), 'Rapi sekali');
    expect(within(dialog).getByText('11/500')).toBeInTheDocument();
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/ulasan anda untuk siti nurjanah/i);
    expect(screen.getByText('Ulasan Anda: 4 dari 5 bintang.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /beri ulasan/i })).not.toBeInTheDocument();
  });

  it('?ulasan=5 langsung membuka dialog ulasan dengan bintang terpilih', () => {
    renderAt('/bookings/BK-0009?ulasan=5', customer);
    const dialog = screen.getByRole('dialog', { name: 'Beri Ulasan' });
    expect(within(dialog).getByRole('radio', { name: '5 bintang, Sangat Baik' })).toBeChecked();
  });

  it('kode tidak dikenal menampilkan pesan tidak ditemukan', () => {
    renderAt('/bookings/BK-9999', customer);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Pesanan tidak ditemukan' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kembali ke Pesanan Saya' })).toHaveAttribute(
      'href',
      '/bookings',
    );
  });
});
