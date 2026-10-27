import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { renderAt } from '@/test/renderWithRouter';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 19, 9)); // Senin, 19 Oktober 2026
});

afterEach(() => vi.useRealTimers());

const customer = { user: DEMO_ACCOUNTS.customer };
const summary = () => screen.getByRole('region', { name: /ringkasan pesanan/i });
const stepper = () => screen.getByRole('navigation', { name: /langkah pemesanan/i });
const next = (user) => user.click(screen.getByRole('button', { name: 'Lanjut' }));

describe('Pesan Layanan', () => {
  it('meminta masuk dulu sebagai pelanggan', () => {
    renderAt('/pesan/rizki-maulana');
    expect(
      screen.getByRole('heading', { level: 1, name: /selamat datang kembali/i }),
    ).toBeVisible();
  });

  it('alur lengkap 4 langkah → pesanan terkirim dan muncul di Pesanan Saya', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/pesan/rizki-maulana', customer);

    // Langkah 1 — Pilih Layanan
    expect(screen.getByRole('heading', { level: 1, name: 'Pesan Layanan' })).toBeVisible();
    expect(stepper()).toHaveTextContent('Pilih LayananSedang diisi');
    expect(screen.getByRole('radio', { name: /layanan kebersihan rumah/i })).toBeChecked();
    await next(user);

    // Langkah 2 — Jadwal: wajib tanggal & jam mulai
    const stepTitle = await screen.findByRole('heading', { level: 2, name: /pilih jadwal/i });
    expect(stepTitle).toHaveFocus();
    expect(router.state.location.search).toBe('?langkah=2');
    expect(stepper()).toHaveTextContent('Pilih LayananSelesai');

    await next(user);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Periksa kembali 2 isian berikut');
    expect(within(alert).getByRole('link', { name: 'Pilih jam mulai layanan.' })).toHaveAttribute(
      'href',
      '#booking-time',
    );

    await user.click(screen.getByRole('button', { name: /selasa, 20 oktober 2026/i }));
    expect(screen.getByRole('button', { name: /minggu, 25 oktober 2026, libur/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: '13.00 WIB, penuh' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '09.00 WIB' }));
    expect(screen.getByRole('button', { name: '09.00 WIB' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Durasi: default 2 jam, dari 09.00 maksimal 3 jam (jeda istirahat 12.00).
    expect(screen.getByText('2 jam', { selector: 'output' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tambah durasi' }));
    expect(screen.getByRole('button', { name: 'Tambah durasi' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Kurangi durasi' }));
    expect(screen.getByText(/terpilih:/i)).toHaveTextContent(
      'Selasa, 20 Oktober 2026 · 09.00–11.00 WIB (2 jam)',
    );
    expect(within(summary()).getByText('Rp100.000')).toBeInTheDocument();
    expect(within(summary()).getByText('Selasa, 20 Oktober 2026')).toBeInTheDocument();
    await next(user);

    // Langkah 3 — Detail Pesanan: data pemesan & alamat utama terisi otomatis
    expect(await screen.findByRole('heading', { level: 2, name: /detail pesanan/i })).toHaveFocus();
    expect(screen.getByText('Budi Santoso', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /rumah/i })).toBeChecked();
    expect(screen.getByRole('status')).toHaveTextContent('Dalam area layanan penyedia (±3 km)');
    expect(within(summary()).getByText(/jl\. cigadung raya no\. 12/i)).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /gunakan alamat lain/i }));
    await next(user);
    expect(screen.getByRole('alert')).toHaveTextContent('Isi alamat lengkap lokasi layanan.');
    await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Dago No. 5, Bandung');
    await user.type(screen.getByRole('textbox', { name: /catatan untuk penyedia/i }), 'Ada kucing');
    expect(screen.getByText('10/300 karakter')).toBeInTheDocument();
    await next(user);

    // Langkah 4 — Kirim Pesanan: persetujuan wajib
    expect(
      await screen.findByRole('heading', { level: 2, name: /periksa kembali pesanan anda/i }),
    ).toHaveFocus();
    const review = screen.getByRole('region', { name: 'Ringkasan pesanan' });
    expect(review).toHaveTextContent('Selasa, 20 Oktober 2026 · 09.00–11.00 WIB (2 jam)');
    expect(review).toHaveTextContent('Jl. Dago No. 5, Bandung');
    expect(review).toHaveTextContent('Budi Santoso · +62 812-3456-7890');

    await user.click(screen.getByRole('button', { name: /kirim pesanan/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/centang persetujuan/i);
    await user.click(screen.getByRole('checkbox', { name: /saya menyetujui/i }));
    await user.click(screen.getByRole('button', { name: /kirim pesanan/i }));

    // Sukses
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Pesanan Berhasil Dikirim!' }),
    ).toHaveFocus();
    expect(router.state.location.search).toBe('?langkah=selesai&kode=BK-0013');
    expect(screen.getByText('BK-0013')).toBeInTheDocument();
    expect(screen.getByText('Sel, 20 Okt 2026 · 09.00–11.00 WIB')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /lihat detail pesanan/i }));
    expect(await screen.findByRole('heading', { level: 1, name: /BK-0013/ })).toBeVisible();
    expect(screen.getByLabelText('Status pesanan')).toHaveTextContent('Menunggu respons penyedia');
    expect(screen.getByText('“Ada kucing”')).toBeInTheDocument();
  });

  it('Ubah di langkah 4 kembali ke langkah terkait', async () => {
    const user = userEvent.setup();
    const { router } = renderAt('/pesan/rizki-maulana?tanggal=2026-10-21', customer);
    await next(user);
    await user.click(await screen.findByRole('button', { name: '10.00 WIB' }));
    await next(user);
    await next(user);
    await user.click(await screen.findByRole('button', { name: 'Ubah jadwal' }));
    expect(await screen.findByRole('heading', { level: 2, name: /pilih jadwal/i })).toHaveFocus();
    expect(router.state.location.search).toBe('?tanggal=2026-10-21&langkah=2');
  });

  it('langkah yang prasyaratnya belum lengkap dikembalikan ke langkah pertama yang kurang', () => {
    renderAt('/pesan/rizki-maulana?langkah=4', customer);
    expect(screen.getByRole('heading', { level: 2, name: /pilih jadwal/i })).toBeInTheDocument();
  });

  it('membaca paket & tanggal dari query (tautan profil penyedia)', () => {
    renderAt('/pesan/siti-nurjanah?paket=busana-muslim&tanggal=2026-10-21', customer);
    expect(screen.getByRole('radio', { name: /jahit busana muslim/i })).toBeChecked();
    expect(within(summary()).getByText('Jahit Busana Muslim')).toBeInTheDocument();
    expect(within(summary()).getByText('Rabu, 21 Oktober 2026')).toBeInTheDocument();
  });

  it('akun tanpa nomor WhatsApp & alamat tersimpan wajib mengisinya di langkah 3', async () => {
    const user = userEvent.setup();
    renderAt('/pesan/rizki-maulana?tanggal=2026-10-21', {
      user: { name: 'Rina Amalia', email: 'rina@gmail.com', role: 'customer' },
    });
    await next(user);
    await user.click(await screen.findByRole('button', { name: '08.00 WIB' }));
    await next(user);
    await screen.findByRole('heading', { level: 2, name: /detail pesanan/i });

    await next(user);
    expect(screen.getByRole('alert')).toHaveTextContent('Periksa kembali 2 isian berikut');
    await user.type(screen.getByLabelText(/nomor whatsapp/i), '0812 9999 1111');
    await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Riau No. 1, Bandung');
    await next(user);
    expect(await screen.findByRole('region', { name: 'Ringkasan pesanan' })).toHaveTextContent(
      'Rina Amalia · +62 81299991111',
    );
  });
});
