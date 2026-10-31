import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const nav = () => within(screen.getByRole('navigation', { name: 'Menu pengelola' }));

describe('Panel Pengelola', () => {
  it('sidebar Pengelola menautkan semua halaman dan menandai halaman aktif', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola');
    expect(screen.getByRole('heading', { level: 1, name: /halo, andi/i })).toBeVisible();
    expect(nav().getByRole('link', { name: 'Ringkasan' })).toHaveAttribute('aria-current', 'page');
    [
      ['Data Alumni', '/pengelola/alumni'],
      ['Data Layanan', '/pengelola/layanan'],
      ['Pesanan', '/pengelola/pesanan'],
      ['Wilayah', '/pengelola/wilayah'],
      ['Laporan', '/pengelola/laporan'],
      ['Pengaturan', '/pengelola/pengaturan'],
    ].forEach(([name, href]) =>
      expect(nav().getByRole('link', { name })).toHaveAttribute('href', href),
    );
    expect(nav().getByRole('link', { name: /verifikasi, 10 menunggu/i })).toBeInTheDocument();

    await user.click(nav().getByRole('link', { name: 'Laporan' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Laporan Program' })).toBeVisible();
  });

  it('Data Alumni: filter status tampil sebagai chip dan bisa dihapus', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola/alumni');
    const table = () => within(screen.getByRole('table', { name: 'Data alumni' }));
    expect(table().getByText('Rizki Maulana')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status:'), 'perbaikan');
    expect(table().queryByText('Rizki Maulana')).not.toBeInTheDocument();
    expect(table().getByText('Agus Setiawan')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Hapus filter Status: Perlu Perbaikan Data' }),
    );
    expect(table().getByText('Rizki Maulana')).toBeInTheDocument();

    expect(table().getByRole('link', { name: 'Lihat detail Rizki Maulana' })).toHaveAttribute(
      'href',
      '/pengelola/alumni/rizki-maulana',
    );
  });

  it('Detail Alumni: kelengkapan, layanan, dan minta perbaikan tercatat di riwayat', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola/alumni/rizki-maulana');
    expect(screen.getByRole('heading', { level: 1, name: 'Rizki Maulana' })).toBeVisible();
    expect(screen.getByText('Data minimum sesuai PRD · 9 dari 10 lengkap.')).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Layanan Rizki Maulana' })).toHaveTextContent(
      'Instalasi Listrik Rumah',
    );

    await user.click(screen.getByRole('button', { name: 'Aksi lain untuk Rizki Maulana' }));
    await user.click(screen.getByRole('menuitem', { name: /minta perbaikan data/i }));
    const dialog = within(screen.getByRole('dialog', { name: 'Minta perbaikan data?' }));
    await user.click(dialog.getByRole('button', { name: 'Kirim Permintaan' }));
    expect(dialog.getByText('Pilih minimal satu bagian.')).toBeInTheDocument();
    await user.click(dialog.getByRole('checkbox', { name: 'Portofolio' }));
    await user.type(dialog.getByLabelText(/catatan untuk alumni/i), 'Tambahkan foto hasil kerja.');
    await user.click(dialog.getByRole('button', { name: 'Kirim Permintaan' }));

    expect(await screen.findByText(/permintaan perbaikan data dikirim/i)).toBeInTheDocument();
    expect(screen.getByText(/portofolio: tambahkan foto hasil kerja\./i)).toBeInTheDocument();
  });

  it('Data Layanan: chip kategori menyaring, lalu sembunyikan layanan dengan alasan', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola/layanan');
    const table = () => within(screen.getByRole('table', { name: 'Daftar layanan' }));
    await user.click(screen.getByRole('button', { name: /^terapi pijat/i }));
    expect(screen.getByRole('button', { name: /^terapi pijat/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(table().getAllByRole('row')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: /^semua/i }));

    await user.click(
      table().getByRole('button', { name: 'Lihat detail layanan Servis Laptop & Komputer' }),
    );
    const drawer = within(screen.getByRole('dialog', { name: 'Servis Laptop & Komputer' }));
    expect(drawer.getByText('Rizki Maulana')).toBeInTheDocument();
    await user.click(drawer.getByRole('button', { name: 'Sembunyikan Layanan' }));

    const dialog = within(screen.getByRole('dialog', { name: 'Sembunyikan layanan ini?' }));
    const confirm = dialog.getByRole('button', { name: 'Sembunyikan' });
    expect(confirm).toBeDisabled();
    await user.type(dialog.getByRole('textbox', { name: /alasan/i }), 'Foto contoh menyesatkan.');
    await user.click(confirm);
    expect(await screen.findByText(/disembunyikan dari pencarian/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(screen.getByRole('dialog', { name: 'Servis Laptop & Komputer' })).getByRole(
          'button',
          { name: 'Tampilkan Lagi' },
        ),
      ).toBeInTheDocument(),
    );
  });

  it('Data Layanan: tab Kategori memakai halaman kategori dengan tab Data Layanan', async () => {
    renderAt('/pengelola/layanan/kategori');
    expect(screen.getByRole('heading', { level: 1, name: 'Data Layanan' })).toBeVisible();
    const tabs = within(screen.getByRole('navigation', { name: 'Bagian Data Layanan' }));
    expect(tabs.getByRole('link', { name: 'Kategori Layanan' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('button', { name: 'Tambah Kategori' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Daftar kategori layanan' })).toBeInTheDocument();
  });

  it('Pesanan: kartu status, grafik, filter, dan drawer detail', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola/pesanan');
    expect(screen.getByText('Hanya baca')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Pesanan per status' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /pesanan per kategori/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status:'), 'menunggu');
    const table = within(screen.getByRole('table', { name: /daftar pesanan/i }));
    table.getAllByText('Menunggu').forEach((badge) => expect(badge).toBeInTheDocument());
    await user.click(table.getByRole('button', { name: 'Detail pesanan BK-0013' }));
    expect(screen.getByRole('dialog', { name: 'BK-0013' })).toBeInTheDocument();
  });

  it('Wilayah: lapisan kepadatan, fokus dari tabel, dan minta titik lokasi', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola/wilayah');
    expect(screen.getByText('22')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /kepadatan pesanan/i }));
    expect(screen.getByRole('note', { name: 'Legenda peta' })).toHaveTextContent('80+');

    await user.click(screen.getByRole('button', { name: 'Fokus di peta: Kota Bandung' }));
    expect(
      screen.getByRole('button', { name: 'Kota Bandung: 31 penyedia, 214 pesanan' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('dialog', { name: 'Info wilayah Kota Bandung' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Minta perbaikan data Agus Setiawan' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Minta perbaikan data?' }));
    expect(dialog.getByRole('checkbox', { name: 'Lokasi' })).toBeChecked();
    await user.type(
      dialog.getByLabelText(/catatan untuk alumni/i),
      'Tentukan titik lokasi di peta.',
    );
    await user.click(dialog.getByRole('button', { name: 'Kirim Permintaan' }));
    expect(await screen.findByText(/dikirim ke agus setiawan/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Minta perbaikan data Agus Setiawan' }),
    ).not.toBeInTheDocument();
  });

  it('Verifikasi: minta perbaikan memindahkan pendaftaran ke tab Perlu Perbaikan', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola/verifikasi');
    expect(screen.getByRole('tab', { name: /perlu perbaikan data.*6/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tinjau Hendra Gunawan' }));
    await user.click(screen.getByRole('button', { name: 'Minta Perbaikan' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Minta perbaikan data?' }));
    await user.type(dialog.getByLabelText(/catatan untuk alumni/i), 'Lengkapi data yang kurang.');
    if (!dialog.getAllByRole('checkbox').some((box) => box.checked))
      await user.click(dialog.getByRole('checkbox', { name: 'Lokasi' }));
    await user.click(dialog.getByRole('button', { name: 'Kirim Permintaan' }));

    expect(await screen.findByText(/permintaan perbaikan dikirim ke hendra/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /perlu perbaikan data.*7/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('table', { name: 'Alumni perlu perbaikan data' })).toHaveTextContent(
      'Hendra Gunawan',
    );
  });

  it('Laporan: buat laporan CSV masuk ke Riwayat Laporan', async () => {
    const user = userEvent.setup();
    renderAt('/pengelola/laporan');
    expect(screen.getByRole('img', { name: /pratinjau laporan ringkasan program/i })).toBeVisible();
    await user.click(screen.getByRole('radio', { name: /data alumni/i }));
    await user.click(screen.getByRole('button', { name: 'Bulan ini' }));
    await user.click(screen.getByRole('radio', { name: 'CSV' }));
    expect(screen.getByRole('table', { name: 'Pratinjau Data Alumni' })).toHaveTextContent(
      'Rizki Maulana',
    );
    await user.click(screen.getByRole('button', { name: 'Buat Laporan' }));
    expect(await screen.findByText(/data alumni \(csv\) dibuat dan diunduh/i)).toBeInTheDocument();
    const rows = within(screen.getByRole('table', { name: 'Riwayat laporan' })).getAllByRole('row');
    expect(rows).toHaveLength(7);
    expect(rows[1]).toHaveTextContent(/data alumni.*1 – 31 okt 2026.*csv.*andi pratama/i);
  });

  it('Pengaturan memakai halaman pengaturan dengan tautan di bawah /pengelola', () => {
    renderAt('/pengelola/pengaturan');
    expect(screen.getByRole('heading', { level: 1, name: 'Pengaturan' })).toBeVisible();
    const sub = within(screen.getByRole('navigation', { name: 'Sub-menu pengaturan' }));
    expect(sub.getByRole('link', { name: 'Keamanan' })).toHaveAttribute(
      'href',
      '/pengelola/pengaturan/keamanan',
    );
    expect(nav().getByRole('link', { name: 'Pengaturan' })).toHaveAttribute('aria-current', 'page');
  });
});
