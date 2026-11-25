import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { renderAt } from '@/test/renderWithRouter';
import { fakeApi } from '@/test/fakeApi';

const customer = { user: DEMO_ACCOUNTS.customer };
const backendCustomer = {
  user: {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Ani Wijaya',
    email: 'ani@djc.test',
    role: 'customer',
  },
};

const apiBooking = (overrides = {}) => ({
  id: '22222222-2222-4222-8222-222222222202',
  code: 'DJC-0002',
  status: 'accepted',
  service: { id: '33333333-3333-4333-8333-333333333301', title: 'Permak celana' },
  provider: {
    id: '44444444-4444-4444-8444-444444444401',
    display_name: 'Siti Rahmawati',
    city: 'Kota Bandung',
    district: 'Coblong',
    phone: '+6281234567891',
    address_detail: 'Jl. Dago No. 10, Coblong, Kota Bandung',
  },
  scheduled_date: '2026-11-28',
  start_time: '10:00',
  service_mode: 'at_provider',
  customer_note: 'Potong 3 cm.',
  pricing_type_snapshot: 'fixed',
  unit_price_snapshot: 35000,
  quantity: 1,
  estimated_total: 35000,
  final_total: null,
  can_review: false,
  created_at: '2026-11-25T03:00:00.000Z',
  history: [
    {
      from_status: null,
      to_status: 'requested',
      changed_by_role: 'customer',
      reason: null,
      created_at: '2026-11-25T03:00:00.000Z',
    },
    {
      from_status: 'requested',
      to_status: 'accepted',
      changed_by_role: 'provider',
      reason: null,
      created_at: '2026-11-25T04:00:00.000Z',
    },
  ],
  ...overrides,
});

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
    expect(contact.queryByText(/whatsapp/i)).not.toBeInTheDocument();
    expect(contact.getByRole('link', { name: /^chat dengan deni setiawan/i })).toHaveAttribute(
      'href',
      '/bookings/BK-0011/chat',
    );
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

  it('FE-04 backend: memuat detail GET /bookings/:id, buka kontak saat accepted, dan batal via PUT /cancel', async () => {
    const user = userEvent.setup();
    fakeApi.bookings = [apiBooking()];

    renderAt('/bookings/DJC-0002', backendCustomer);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Detail pesanan DJC-0002',
    );

    // Kontak (telepon + alamat) terbuka saat status accepted.
    const contact = within(screen.getByRole('region', { name: 'Kontak & Lokasi' }));
    expect(await contact.findByRole('link', { name: '+6281234567891' })).toHaveAttribute(
      'href',
      'tel:+6281234567891',
    );
    expect(contact.getByText('Jl. Dago No. 10, Coblong, Kota Bandung')).toBeInTheDocument();

    // Batalkan via PUT /bookings/:id/cancel.
    await user.click(screen.getByRole('button', { name: 'Batalkan pesanan DJC-0002' }));
    const dialog = screen.getByRole('dialog', { name: 'Batalkan pesanan?' });
    await user.type(within(dialog).getByLabelText(/alasan pembatalan/i), 'Ada keperluan mendadak');
    await user.click(within(dialog).getByRole('button', { name: 'Ya, Batalkan' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Pesanan DJC-0002 berhasil dibatalkan',
    );
    expect(
      fakeApi.calls.some(
        (c) =>
          c.method === 'PUT' &&
          c.path === '/bookings/22222222-2222-4222-8222-222222222202/cancel' &&
          c.body?.reason === 'Ada keperluan mendadak',
      ),
    ).toBe(true);
    // Kontak terkunci kembali setelah dibatalkan.
    expect(screen.getByRole('region', { name: 'Kontak & Lokasi' })).toHaveTextContent(/terkunci/i);
  });

  it('FE-05a backend: mengirim ulasan via POST /bookings/:id/reviews dan menampilkan error jika 409', async () => {
    const user = userEvent.setup();
    fakeApi.bookings = [
      apiBooking({
        id: '22222222-2222-4222-8222-222222222205',
        code: 'DJC-0005',
        status: 'completed',
        can_review: true,
        provider: {
          ...apiBooking().provider,
          display_name: 'Deni Setiawan',
          phone: null,
          address_detail: null,
        },
      }),
    ];

    renderAt('/bookings/DJC-0005', backendCustomer);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Detail pesanan DJC-0005',
    );

    // Simulasi error 409 terlebih dahulu — dialog tetap terbuka dan tampilkan pesan error.
    fakeApi.reviewError = [
      { error: { code: 'CONFLICT', message: 'Pesanan ini sudah diberi ulasan.' } },
      409,
    ];
    await user.click(screen.getByRole('button', { name: 'Beri ulasan untuk Deni Setiawan' }));
    const dialog = screen.getByRole('dialog', { name: 'Beri Ulasan' });
    await user.click(within(dialog).getByRole('radio', { name: '5 bintang, Sangat Baik' }));
    await user.type(within(dialog).getByLabelText(/ceritakan pengalaman/i), 'Sangat memuaskan!');
    await user.click(within(dialog).getByRole('button', { name: 'Kirim Ulasan' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Pesanan ini sudah diberi ulasan.',
    );

    // Sukses kirim ulasan.
    fakeApi.reviewError = null;
    await user.click(within(dialog).getByRole('button', { name: 'Kirim Ulasan' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/ulasan anda untuk deni setiawan/i);
    expect(
      fakeApi.calls.some(
        (c) =>
          c.method === 'POST' &&
          c.path === '/bookings/22222222-2222-4222-8222-222222222205/reviews' &&
          c.body?.rating === 5 &&
          c.body?.comment === 'Sangat memuaskan!',
      ),
    ).toBe(true);
    expect(screen.queryByRole('button', { name: /beri ulasan/i })).not.toBeInTheDocument();
  });
});
