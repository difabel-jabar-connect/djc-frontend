import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const subnav = () => within(screen.getByRole('navigation', { name: 'Sub-menu pengaturan' }));
const adminNav = () => within(screen.getByRole('navigation', { name: /menu admin/i }));
const firstAuditRow = () =>
  within(screen.getByRole('table', { name: /audit log/i })).getAllByRole('row')[1];

describe('Pengaturan Admin', () => {
  it('sub-menu menandai halaman aktif dan berpindah antar-bagian', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan');
    expect(screen.getByRole('heading', { level: 1, name: 'Pengaturan' })).toBeVisible();
    expect(subnav().getByRole('link', { name: 'Profil Saya' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(subnav().getByRole('link', { name: 'Aturan Sistem' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Aturan Sistem' })).toBeVisible();
    expect(screen.getByText('Hanya baca')).toBeInTheDocument();
    expect(screen.getByText('Batas respons pesanan')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('Profil Saya: email terkunci, simpan perubahan, lalu tercatat di Audit Log', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan');
    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('readonly');
    expect(email).toHaveValue('andi.pratama@uptdppsghd.id');
    expect(screen.getByText('Semua perubahan sudah tersimpan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Simpan Perubahan' })).toBeDisabled();

    const phone = screen.getByLabelText(/nomor whatsapp/i);
    await user.clear(phone);
    await user.type(phone, '81399887766');
    expect(screen.getByText('Diubah dari +62 813-2244-6677.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Warna avatar Teal' }));
    expect(screen.getByText('Ada perubahan yang belum disimpan')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }));
    expect(await screen.findByText(/profil disimpan/i)).toBeInTheDocument();
    expect(screen.getByText('Semua perubahan sudah tersimpan')).toBeInTheDocument();

    await user.click(adminNav().getByRole('link', { name: 'Audit Log' }));
    expect(firstAuditRow()).toHaveTextContent(/andi pratama.*ubah profil/i);
  });

  it('Profil Saya: nama kosong ditolak dan Batalkan mengembalikan isian', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan');
    const name = screen.getByLabelText(/nama lengkap/i);
    await user.clear(name);
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }));
    expect(screen.getByText(/nama lengkap wajib diisi/i)).toBeInTheDocument();
    expect(name).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Batalkan' }));
    expect(name).toHaveValue('Andi Pratama');
  });

  it('Profil Saya: meminta konfirmasi sebelum meninggalkan perubahan', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan');
    await user.type(screen.getByLabelText(/jabatan/i), ' Senior');
    await user.click(subnav().getByRole('link', { name: 'Keamanan' }));
    const dialog = within(screen.getByRole('alertdialog', { name: 'Tinggalkan halaman ini?' }));
    await user.click(dialog.getByRole('button', { name: 'Tetap di Sini' }));
    expect(screen.getByLabelText(/jabatan/i)).toHaveValue('Koordinator Layanan Alumni Senior');

    await user.click(subnav().getByRole('link', { name: 'Keamanan' }));
    await user.click(screen.getByRole('button', { name: 'Tinggalkan' }));
    expect(await screen.findByRole('heading', { name: 'Ubah Kata Sandi' })).toBeVisible();
  });

  it('Keamanan: kekuatan sandi, tampilkan sandi, dan perbarui kata sandi', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan/keamanan');
    const next = screen.getByLabelText(/^kata sandi baru/i, { selector: 'input' });
    await user.type(next, 'abc');
    expect(screen.getByText('Lemah')).toBeInTheDocument();
    await user.type(next, 'DEF123');
    expect(screen.getByText('Kuat')).toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: 'Tampilkan kata sandi baru' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(next).toHaveAttribute('type', 'text');

    await user.type(
      screen.getByLabelText(/ulangi kata sandi baru/i, { selector: 'input' }),
      'abcDEF123',
    );
    expect(screen.getByText('Kata sandi cocok')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Perbarui Kata Sandi' }));
    expect(screen.getByText('Masukkan kata sandi saat ini.')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/kata sandi saat ini/i, { selector: 'input' }),
      'lamaSekali1',
    );
    await user.click(screen.getByRole('button', { name: 'Perbarui Kata Sandi' }));
    expect(await screen.findByText(/kata sandi diperbarui. sesi/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /keluarkan safari/i })).not.toBeInTheDocument();
    expect(screen.getByText('Tidak ada perangkat lain yang sedang masuk.')).toBeInTheDocument();
  });

  it('Keamanan: keluarkan satu sesi lalu semua perangkat lain', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan/keamanan');
    expect(screen.getByText('Perangkat ini')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keluarkan Safari · iPhone' }));
    expect(await screen.findByText(/safari · iphone dikeluarkan/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keluar dari Semua Perangkat Lain' }));
    const dialog = within(
      screen.getByRole('alertdialog', { name: 'Keluar dari semua perangkat lain?' }),
    );
    await user.click(dialog.getByRole('button', { name: 'Keluarkan Semua' }));
    expect(await screen.findByText(/1 perangkat lain dikeluarkan/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /^keluarkan edge/i })).not.toBeInTheDocument(),
    );

    await user.click(adminNav().getByRole('link', { name: 'Audit Log' }));
    expect(firstAuditRow()).toHaveTextContent(/keluarkan sesi.*1 perangkat lain/i);
  });

  it('Notifikasi: switch tersimpan langsung; ringkasan harian hanya email', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan/notifikasi');
    const toggle = screen.getByRole('switch', {
      name: 'Email: Pesanan Menunggu lebih dari 20 jam',
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByText(/notifikasi email .* diaktifkan/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('switch', { name: 'In-App: Ringkasan harian aktivitas platform' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Hanya email')).toBeInTheDocument();
    expect(screen.getByText(/notifikasi keamanan akun selalu dikirim/i)).toBeInTheDocument();
  });

  it('Informasi Platform: ringkasan perubahan, alasan wajib, lalu tercatat', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan/informasi');
    const hours = screen.getByLabelText(/jam layanan/i);
    await user.clear(hours);
    await user.type(hours, 'Senin–Jumat, 08.00–16.00 WIB');
    expect(screen.getByText('Diubah dari “08.00–15.00 WIB”.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }));
    const dialog = within(
      screen.getByRole('dialog', { name: 'Simpan perubahan informasi platform?' }),
    );
    expect(dialog.getByText('1 perubahan')).toBeInTheDocument();
    expect(dialog.getByText('08.00–15.00 WIB', { exact: false })).toBeInTheDocument();
    const save = dialog.getByRole('button', { name: 'Simpan' });
    expect(save).toBeDisabled();
    await user.type(
      dialog.getByRole('textbox', { name: /alasan perubahan/i }),
      'Jam layanan baru.',
    );
    await user.click(save);
    expect(await screen.findByText(/informasi platform disimpan/i)).toBeInTheDocument();

    await user.click(adminNav().getByRole('link', { name: 'Audit Log' }));
    expect(firstAuditRow()).toHaveTextContent(/ubah informasi platform.*kontak bantuan/i);
  });

  it('Informasi Platform: tambah mitra tampil di pratinjau footer', async () => {
    const user = userEvent.setup();
    renderAt('/admin/pengaturan/informasi');
    await user.click(screen.getByRole('button', { name: 'Tambah Mitra' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Tambah Mitra' }));
    await user.type(dialog.getByLabelText(/nama mitra/i), 'Dinas Sosial Jabar');
    await user.click(dialog.getByRole('button', { name: 'Tambah Mitra' }));
    const preview = within(screen.getByRole('figure', { name: /pratinjau footer/i }));
    expect(preview.getByText('Dinas Sosial Jabar')).toBeInTheDocument();
    expect(screen.getByText('Ada perubahan yang belum disimpan')).toBeInTheDocument();
  });
});
