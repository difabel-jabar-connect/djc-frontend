import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const userTable = () => within(screen.getByRole('table', { name: 'Daftar user' }));
const rowOf = (name) => userTable().getByText(name).closest('tr');

async function openAddMenu(user, item) {
  await user.click(screen.getByRole('button', { name: 'Tambah Akun' }));
  const menu = screen.getByRole('menu', { name: 'Pilih jenis akun' });
  expect(within(menu).getAllByRole('menuitem')[0]).toHaveFocus();
  await user.click(within(menu).getByRole('menuitem', { name: new RegExp(item, 'i') }));
}

describe('Kelola User', () => {
  it('menampilkan daftar user, tab, filter, dan akun sendiri tidak bisa diubah', async () => {
    const user = userEvent.setup();
    renderAt('/admin/user');
    expect(screen.getByText('Menampilkan 1–10 dari 12 user')).toBeInTheDocument();
    expect(rowOf('Andi Pratama')).toHaveTextContent('(Anda)');
    expect(rowOf('Andi Pratama')).toHaveTextContent('Sedang aktif');
    expect(
      within(rowOf('Andi Pratama')).getByRole('button', { name: 'Aksi lain untuk Andi Pratama' }),
    ).toHaveAttribute('aria-disabled', 'true');

    await user.click(screen.getByRole('tab', { name: /disuspensi/i }));
    expect(userTable().getAllByRole('row')).toHaveLength(3);
    expect(rowOf('Joko Susilo')).toHaveTextContent(/spam pesanan fiktif/i);

    await user.click(screen.getByRole('tab', { name: /semua/i }));
    await user.type(screen.getByRole('searchbox', { name: /cari nama atau email/i }), 'rina');
    expect(userTable().getAllByRole('row')).toHaveLength(3);
    await user.selectOptions(screen.getByLabelText('Peran:'), 'pengelola');
    expect(userTable().getAllByRole('row')).toHaveLength(2);
    expect(rowOf('Rina Kartika')).toBeInTheDocument();
  });

  it('membuat akun Pengguna dengan undangan: validasi, pop-up sukses, dan baris baru', async () => {
    const user = userEvent.setup();
    renderAt('/admin/user');
    await openAddMenu(user, 'akun pengguna');

    const drawer = within(screen.getByRole('dialog', { name: 'Tambah Akun Pengguna' }));
    await user.click(drawer.getByRole('button', { name: 'Buat Akun' }));
    expect(drawer.getByRole('textbox', { name: /nama lengkap/i })).toHaveFocus();
    expect(drawer.getByText(/nama lengkap wajib diisi/i)).toBeInTheDocument();
    expect(drawer.getByText('Nomor WhatsApp wajib diisi.')).toBeInTheDocument();

    await user.type(drawer.getByRole('textbox', { name: /nama lengkap/i }), 'Sari Wahyuni');
    await user.type(drawer.getByRole('textbox', { name: /email/i }), 'budi.santoso@email.com');
    expect(drawer.getByText('Email ini sudah terdaftar.')).toBeInTheDocument();
    await user.clear(drawer.getByRole('textbox', { name: /email/i }));
    await user.type(drawer.getByRole('textbox', { name: /email/i }), 'sari.wahyuni@email.com');
    await user.type(drawer.getByRole('textbox', { name: /nomor whatsapp/i }), '081398765432');
    await user.selectOptions(
      drawer.getByRole('combobox', { name: /kota\/kabupaten/i }),
      'Kabupaten Bandung',
    );
    await user.click(drawer.getByRole('button', { name: 'Buat Akun' }));

    const success = within(await screen.findByRole('dialog', { name: 'Akun Berhasil Dibuat' }));
    expect(success.getByText(/undangan telah dikirim ke/i)).toHaveTextContent(
      'sari.wahyuni@email.com',
    );
    expect(success.getByText('Menunggu Aktivasi')).toBeInTheDocument();
    expect(success.getByRole('button', { name: 'Salin Tautan Undangan' })).toBeInTheDocument();
    await user.click(success.getByRole('button', { name: 'Selesai' }));

    expect(screen.getByText(/akun dibuat\. aksi tercatat di audit log/i)).toBeInTheDocument();
    const firstRow = userTable().getAllByRole('row')[1];
    expect(firstRow).toHaveTextContent(/sari wahyuni.*pengguna.*bandung.*menunggu aktivasi/i);
    expect(firstRow).toHaveClass('ad-row--new');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Kelola User' })).toHaveFocus(),
    );
  });

  it('akun Pengelola wajib email instansi dan konfirmasi; kata sandi sementara ditampilkan', async () => {
    const user = userEvent.setup();
    renderAt('/admin/user');
    await openAddMenu(user, 'akun pengguna');
    // Ganti jenis akun langsung di drawer.
    await user.click(screen.getByRole('radio', { name: 'Pengelola' }));
    const drawer = within(screen.getByRole('dialog', { name: 'Tambah Akun Pengelola' }));
    expect(drawer.getByText(/akses penuh ke dashboard admin, termasuk/i)).toBeInTheDocument();

    await user.type(drawer.getByRole('textbox', { name: /nama lengkap/i }), 'Rina Wulandari');
    await user.type(drawer.getByRole('textbox', { name: /email/i }), 'rina.wulandari@gmail.com');
    await user.type(drawer.getByRole('textbox', { name: /nomor whatsapp/i }), '82115566778');
    await user.selectOptions(
      drawer.getByRole('combobox', { name: /kota\/kabupaten/i }),
      'Kota Bandung',
    );
    await user.type(drawer.getByRole('textbox', { name: /jabatan/i }), 'Staf Pemberdayaan Alumni');
    await user.click(drawer.getByRole('radio', { name: /buat kata sandi sementara/i }));
    await user.type(drawer.getByRole('textbox', { name: /alasan pembuatan akun/i }), 'Singkat');
    await user.click(drawer.getByRole('button', { name: 'Buat Akun Pengelola' }));
    expect(drawer.getByText(/wajib memakai email instansi/i)).toBeInTheDocument();
    expect(drawer.getByText(/alasan pembuatan akun minimal 10 karakter/i)).toBeInTheDocument();
    expect(drawer.getByRole('textbox', { name: /email/i })).toHaveFocus();

    await user.clear(drawer.getByRole('textbox', { name: /email/i }));
    await user.type(
      drawer.getByRole('textbox', { name: /email/i }),
      'rina.wulandari@uptdppsghd.id',
    );
    await user.type(
      drawer.getByRole('textbox', { name: /alasan pembuatan akun/i }),
      ' untuk staf baru.',
    );
    await user.click(drawer.getByRole('button', { name: 'Buat Akun Pengelola' }));

    const confirm = within(screen.getByRole('alertdialog', { name: 'Buat akun pengelola?' }));
    expect(confirm.getByText('Staf Pemberdayaan Alumni')).toBeInTheDocument();
    await user.click(confirm.getByRole('button', { name: 'Ya, Buat Akun' }));

    const success = within(await screen.findByRole('dialog', { name: 'Akun Berhasil Dibuat' }));
    expect(success.getByText('Kata sandi sementara')).toBeInTheDocument();
    expect(success.getByText('Aktif')).toBeInTheDocument();
    await user.click(success.getByRole('button', { name: 'Tambah Akun Lain' }));
    expect(screen.getByRole('dialog', { name: 'Tambah Akun Pengelola' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /nama lengkap/i })).toHaveValue('');
  });

  it('menyuspensi lewat menu baris dan mengaktifkan kembali dari drawer detail', async () => {
    const user = userEvent.setup();
    renderAt('/admin/user');
    await user.click(
      within(rowOf('Budi Santoso')).getByRole('button', { name: 'Aksi lain untuk Budi Santoso' }),
    );
    await user.click(screen.getByRole('menuitem', { name: 'Suspensi akun' }));

    const suspend = within(screen.getByRole('dialog', { name: 'Suspensi akun?' }));
    await user.type(
      suspend.getByRole('textbox', { name: /alasan/i }),
      'Pesanan fiktif berulang kali.',
    );
    await user.click(suspend.getByRole('button', { name: 'Ya, Suspensi' }));
    expect(await screen.findByText(/akun budi santoso disuspensi/i)).toBeInTheDocument();
    expect(rowOf('Budi Santoso')).toHaveTextContent(/disuspensi.*pesanan fiktif berulang kali/i);

    await user.click(screen.getByRole('button', { name: 'Lihat detail Joko Susilo' }));
    const drawer = within(screen.getByRole('dialog', { name: 'Joko Susilo' }));
    expect(drawer.getByText(/disuspensi oleh rina kartika/i)).toBeInTheDocument();
    expect(drawer.getByText(/suspensi akun/i, { selector: '.ad-badge' })).toBeInTheDocument();
    await user.click(drawer.getByRole('button', { name: 'Aktifkan Kembali' }));

    const activate = within(screen.getByRole('dialog', { name: 'Aktifkan kembali akun?' }));
    await user.type(
      activate.getByRole('textbox', { name: /alasan/i }),
      'Sudah klarifikasi dengan admin.',
    );
    await user.click(activate.getByRole('button', { name: 'Ya, Aktifkan' }));
    expect(await screen.findByText(/akun joko susilo aktif kembali/i)).toBeInTheDocument();
    expect(rowOf('Joko Susilo')).not.toHaveTextContent('Disuspensi');
  });
});
