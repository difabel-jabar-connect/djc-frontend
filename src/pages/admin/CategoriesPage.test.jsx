import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';

const table = () => within(screen.getByRole('table', { name: 'Daftar kategori layanan' }));
const rowOf = (name) => table().getByText(name).closest('tr');

describe('Kategori Layanan', () => {
  it('hanya kategori tanpa layanan yang bisa dihapus', () => {
    renderAt('/admin/kategori');
    expect(table().getAllByRole('row')).toHaveLength(8);
    expect(rowOf('Kerajinan')).toHaveTextContent(/0 · kosong.*nonaktif/i);
    expect(table().getAllByRole('button', { name: /^hapus kategori/i })).toHaveLength(1);
  });

  it('menambah kategori: nama ganda ditolak, ikon & status bisa dipilih', async () => {
    const user = userEvent.setup();
    renderAt('/admin/kategori');
    await user.click(screen.getByRole('button', { name: 'Tambah Kategori' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Tambah Kategori' }));
    const save = dialog.getByRole('button', { name: 'Simpan' });
    expect(save).toBeDisabled();

    const name = dialog.getByRole('textbox', { name: /nama kategori/i });
    await user.type(name, 'servis elektronik');
    expect(dialog.getByText('Nama kategori sudah ada.')).toBeInTheDocument();
    expect(save).toBeDisabled();

    await user.clear(name);
    await user.type(name, 'Fotografi');
    await user.click(dialog.getByRole('radio', { name: 'Ikon Kalender' }));
    const toggle = dialog.getByRole('switch', { name: 'Status Aktif' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await user.click(save);

    expect(screen.getByText(/kategori “fotografi” ditambahkan/i)).toBeInTheDocument();
    expect(rowOf('Fotografi')).toHaveTextContent(/0 · kosong.*nonaktif/i);
  });

  it('menonaktifkan dengan alasan dan menghapus kategori kosong', async () => {
    const user = userEvent.setup();
    renderAt('/admin/kategori');
    await user.click(screen.getByRole('button', { name: 'Nonaktifkan kategori Kebersihan' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Nonaktifkan kategori?' }));
    await user.type(dialog.getByRole('textbox', { name: /alasan/i }), 'Penataan ulang kategori.');
    await user.click(dialog.getByRole('button', { name: 'Ya, Nonaktifkan' }));
    expect(await screen.findByText(/kategori “kebersihan” dinonaktifkan/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Aktifkan kategori Kebersihan' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hapus kategori Kerajinan' }));
    const confirm = within(
      screen.getByRole('alertdialog', { name: /hapus kategori “kerajinan”/i }),
    );
    await user.click(confirm.getByRole('button', { name: 'Ya, Hapus' }));
    expect(await screen.findByText(/kategori “kerajinan” dihapus/i)).toBeInTheDocument();
    expect(table().queryByText('Kerajinan')).not.toBeInTheDocument();
  });

  it('mengubah kategori yang ada', async () => {
    const user = userEvent.setup();
    renderAt('/admin/kategori');
    await user.click(screen.getByRole('button', { name: 'Ubah kategori Desain Grafis' }));
    const dialog = within(screen.getByRole('dialog', { name: 'Ubah Kategori' }));
    expect(dialog.getByRole('textbox', { name: /nama kategori/i })).toHaveValue('Desain Grafis');
    const description = dialog.getByRole('textbox', { name: /deskripsi/i });
    await user.clear(description);
    await user.type(description, 'Logo, poster, dan kemasan.');
    await user.click(dialog.getByRole('button', { name: 'Simpan' }));
    expect(rowOf('Desain Grafis')).toHaveTextContent('Logo, poster, dan kemasan.');
  });
});
