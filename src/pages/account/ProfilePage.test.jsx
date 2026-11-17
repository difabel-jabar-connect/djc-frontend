import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '@/test/renderWithRouter';
import { fakeApi } from '@/test/fakeApi';

const sessionUser = (overrides = {}) => {
  Object.assign(fakeApi.account.user, overrides);
  return { ...fakeApi.account.user };
};

const openProfile = (overrides) => renderAt('/profil', { user: sessionUser(overrides) });
const addressList = () => screen.findByRole('list', { name: 'Daftar alamat tersimpan' });
const panel = (name) => screen.getByRole('region', { name });
const callsTo = (method, path) =>
  fakeApi.calls.filter((call) => call.method === method && call.path === path);

describe('Profil Saya', () => {
  it('menampilkan identitas, alamat tersimpan dari backend, dan alamat utama di atas', async () => {
    openProfile();

    expect(screen.getByRole('heading', { level: 1, name: 'Profil Saya' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Budi Santoso' })).toBeInTheDocument();
    expect(screen.getByText('budi.santoso@contoh.id', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getAllByText('+62 812-3456-7890')).toHaveLength(2); // identitas + Data Diri
    expect(
      within(screen.getByRole('navigation', { name: 'Akun' })).getByRole('link', {
        name: /pesanan saya/i,
      }),
    ).toHaveAttribute('href', '/bookings');

    const items = within(await addressList()).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent(/Rumah\s*Utama/);
    expect(items[1]).toHaveTextContent('Jl. Asia Afrika No. 88');
    expect(panel('Alamat Tersimpan')).toHaveTextContent('2 dari 10 alamat');
    expect(screen.getByRole('img', { name: /peta 2 alamat tersimpan/i })).toBeInTheDocument();
  });

  it('tamu diarahkan ke halaman Masuk', async () => {
    const { router } = renderAt('/profil');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('menu akun di header punya tautan Profil Saya', async () => {
    const user = userEvent.setup();
    renderAt('/', { user: sessionUser() });
    await user.click(screen.getByRole('button', { name: 'Menu akun Budi Santoso' }));
    expect(screen.getByRole('link', { name: 'Profil Saya' })).toHaveAttribute('href', '/profil');
  });

  it('menjadikan alamat lain sebagai alamat utama', async () => {
    const user = userEvent.setup();
    openProfile();
    await addressList();

    await user.click(screen.getByRole('button', { name: 'Jadikan Kantor alamat utama' }));

    expect(await screen.findByText('Kantor sekarang alamat utama.')).toBeInTheDocument();
    expect(callsTo('PATCH', '/me/addresses/kantor')[0].body).toEqual({ is_primary: true });
    const items = within(await addressList()).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/Kantor\s*Utama/);
    expect(
      screen.queryByRole('button', { name: 'Jadikan Kantor alamat utama' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jadikan Rumah alamat utama' })).toBeInTheDocument();
  });

  it('mengubah alamat lewat pop-up peta yang sama dengan Pesan', async () => {
    const user = userEvent.setup();
    openProfile();
    await addressList();

    await user.click(screen.getByRole('button', { name: 'Ubah alamat Kantor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Ubah Alamat' });
    const text = within(dialog).getByLabelText(/alamat lengkap/i);
    expect(text).toHaveValue('Jl. Asia Afrika No. 88, Sumur Bandung, Bandung');
    await user.type(within(dialog).getByLabelText(/detail lainnya/i), 'Lantai 3');
    await user.click(within(dialog).getByRole('button', { name: 'Simpan Alamat' }));

    expect(await screen.findByText('Alamat Kantor diperbarui.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Ubah Alamat' })).not.toBeInTheDocument();
    expect(callsTo('PATCH', '/me/addresses/kantor')[0].body).toMatchObject({
      label: 'Kantor',
      address: 'Jl. Asia Afrika No. 88, Sumur Bandung, Bandung',
      detail: 'Lantai 3',
    });
    expect(screen.getByText('Lantai 3')).toBeInTheDocument();
  });

  it('menambah alamat baru dan menyimpannya di akun', async () => {
    const user = userEvent.setup();
    openProfile();
    await addressList();

    await user.click(screen.getByRole('button', { name: 'Tambah alamat' }));
    const dialog = await screen.findByRole('dialog', { name: 'Tambah Alamat' });
    await user.click(within(dialog).getByRole('radio', { name: 'Lainnya' }));
    const text = within(dialog).getByLabelText(/alamat lengkap/i);
    await user.clear(text);
    await user.type(text, 'Jl. Braga No. 10, Sumur Bandung, Bandung');
    await user.click(within(dialog).getByRole('button', { name: 'Simpan Alamat' }));

    expect(await screen.findByText('Alamat Lainnya ditambahkan.')).toBeInTheDocument();
    expect(callsTo('POST', '/me/addresses')[0].body).toMatchObject({
      label: 'Lainnya',
      address: 'Jl. Braga No. 10, Sumur Bandung, Bandung',
    });
    expect(within(await addressList()).getAllByRole('listitem')).toHaveLength(3);
    expect(panel('Alamat Tersimpan')).toHaveTextContent('3 dari 10 alamat');
  });

  it('menghapus alamat setelah konfirmasi', async () => {
    const user = userEvent.setup();
    openProfile();
    await addressList();

    await user.click(screen.getByRole('button', { name: 'Hapus alamat Kantor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Hapus alamat Kantor?' });
    expect(dialog).toHaveTextContent('Pesanan yang sudah dibuat tidak berubah.');
    await user.click(within(dialog).getByRole('button', { name: 'Hapus alamat' }));

    expect(await screen.findByText('Alamat Kantor dihapus.')).toBeInTheDocument();
    expect(callsTo('DELETE', '/me/addresses/kantor')).toHaveLength(1);
    expect(within(await addressList()).getAllByRole('listitem')).toHaveLength(1);
  });

  it('akun tanpa alamat melihat ajakan menambah alamat', async () => {
    fakeApi.account.addresses = [];
    openProfile();
    expect(await screen.findByRole('heading', { name: 'Belum ada alamat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tambah alamat' })).toBeEnabled();
  });

  it('menyimpan nama dan nomor HP baru, lalu header ikut berubah', async () => {
    const user = userEvent.setup();
    openProfile();
    const personal = panel('Data Diri');
    // Data diri tampil sebagai teks dulu; baru bisa diubah lewat tombol Ubah data diri.
    expect(within(personal).queryByRole('textbox')).not.toBeInTheDocument();
    // Email hanya ditampilkan, tidak bisa diganti dari sini.
    expect(within(personal).getByText('budi.santoso@contoh.id')).toBeInTheDocument();
    expect(within(personal).queryByRole('button', { name: /email/i })).not.toBeInTheDocument();
    expect(within(personal).getByText('Budi Santoso', { selector: 'dd' })).toBeInTheDocument();
    await user.click(within(personal).getByRole('button', { name: 'Ubah data diri' }));
    const name = within(personal).getByLabelText(/nama lengkap/i);
    expect(name).toHaveFocus();
    const phone = within(personal).getByLabelText(/nomor hp/i);
    expect(phone).toHaveValue('81234567890');

    await user.clear(name);
    await user.type(name, 'Budi Santoso Putra');
    await user.clear(phone);
    await user.type(phone, '0812 9999 1111');
    await user.click(within(personal).getByRole('button', { name: 'Simpan perubahan' }));

    expect(await within(personal).findByText('Data diri disimpan.')).toBeInTheDocument();
    expect(within(personal).queryByRole('textbox')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(within(personal).getByRole('button', { name: 'Ubah data diri' })).toHaveFocus(),
    );
    expect(callsTo('PATCH', '/me')[0].body).toEqual({
      name: 'Budi Santoso Putra',
      phone: '+6281299991111',
    });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Budi Santoso Putra' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('+62 812-9999-1111')).toHaveLength(2);
    expect(
      screen.getByRole('button', { name: 'Menu akun Budi Santoso Putra' }),
    ).toBeInTheDocument();
  });

  it('nomor HP yang salah ditolak sebelum dikirim', async () => {
    const user = userEvent.setup();
    openProfile();
    const personal = panel('Data Diri');
    await user.click(within(personal).getByRole('button', { name: 'Ubah data diri' }));
    const phone = within(personal).getByLabelText(/nomor hp/i);
    await user.clear(phone);
    await user.type(phone, '12345');
    await user.click(within(personal).getByRole('button', { name: 'Simpan perubahan' }));

    expect(within(personal).getByText('Nomor HP belum valid, contoh: 81234567890.')).toBeVisible();
    expect(phone).toHaveAttribute('aria-invalid', 'true');
    expect(phone).toHaveFocus();
    expect(callsTo('PATCH', '/me')).toHaveLength(0);

    // Batal menutup form tanpa menyimpan.
    await user.click(within(personal).getByRole('button', { name: 'Batal' }));
    expect(within(personal).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(personal).getByText('+62 812-3456-7890')).toBeInTheDocument();
  });

  it('mengganti kata sandi lewat tombol Ganti kata sandi: salah ditandai, lalu berhasil', async () => {
    const user = userEvent.setup();
    openProfile();
    const security = panel('Keamanan');
    expect(within(security).queryByRole('form')).not.toBeInTheDocument();
    await user.click(within(security).getByRole('button', { name: 'Ganti kata sandi' }));
    const form = within(security).getByRole('form', { name: 'Ganti kata sandi' });
    const current = within(form).getByLabelText(/^kata sandi saat ini/i);
    expect(current).toHaveFocus();
    await user.type(current, 'Salah123');
    await user.type(within(form).getByLabelText(/^kata sandi baru/i), 'BaruSekali9');
    await user.type(within(form).getByLabelText(/^ulangi kata sandi baru/i), 'BaruSekali9');
    await user.click(within(form).getByRole('button', { name: 'Simpan kata sandi' }));

    expect(await within(form).findByText('Kata sandi saat ini salah.')).toBeVisible();
    expect(current).toHaveFocus();

    await user.clear(current);
    await user.type(current, 'Demo12345');
    await user.click(within(form).getByRole('button', { name: 'Simpan kata sandi' }));

    expect(await within(security).findByText(/kata sandi diganti/i)).toBeInTheDocument();
    expect(fakeApi.account.password).toBe('BaruSekali9');
    expect(within(security).queryByRole('form')).not.toBeInTheDocument();
  });

  it('kata sandi baru yang lemah atau tidak sama ditolak sebelum dikirim', async () => {
    const user = userEvent.setup();
    openProfile();
    const security = panel('Keamanan');
    await user.click(within(security).getByRole('button', { name: 'Ganti kata sandi' }));
    const form = within(security).getByRole('form', { name: 'Ganti kata sandi' });
    await user.type(within(form).getByLabelText(/^kata sandi saat ini/i), 'Demo12345');
    await user.type(within(form).getByLabelText(/^kata sandi baru/i), 'pendek');
    await user.type(within(form).getByLabelText(/^ulangi kata sandi baru/i), 'lain');
    await user.click(within(form).getByRole('button', { name: 'Simpan kata sandi' }));

    expect(within(form).getByText(/belum memenuhi semua syarat/i)).toBeVisible();
    expect(within(form).getByText('Kata sandi tidak sama.')).toBeVisible();
    expect(callsTo('PUT', '/me/password')).toHaveLength(0);

    await user.click(within(form).getByRole('button', { name: 'Batal' }));
    expect(within(security).queryByRole('form')).not.toBeInTheDocument();
  });

  it('akun Google: kata sandi dibuat lewat Lupa Kata Sandi', async () => {
    openProfile({ has_password: false });
    expect(screen.getByText('Masuk dengan Google')).toBeInTheDocument();

    const security = panel('Keamanan');
    expect(within(security).queryByRole('form')).not.toBeInTheDocument();
    expect(within(security).getByRole('link', { name: 'Lupa Kata Sandi' })).toHaveAttribute(
      'href',
      '/lupa-kata-sandi',
    );
  });

  it('mengunggah dan menghapus foto profil, menolak file bukan gambar', async () => {
    const user = userEvent.setup({ applyAccept: false });
    const { container } = openProfile();
    const input = container.querySelector('input[type="file"]');

    await user.upload(input, new File(['%PDF'], 'ktp.pdf', { type: 'application/pdf' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Pilih foto JPG, PNG, WebP, GIF, atau AVIF.',
    );
    expect(callsTo('PUT', '/me/photo')).toHaveLength(0);

    await user.upload(input, new File(['png'], 'foto.png', { type: 'image/png' }));
    expect(await screen.findByText('Foto profil diperbarui.')).toBeInTheDocument();
    expect(callsTo('PUT', '/me/photo')[0].body.image).toMatch(/^data:image\/png;base64,/);
    expect(container.querySelector('.profile-avatar img')).toHaveAttribute(
      'src',
      'https://res.cloudinary.test/foto.webp',
    );
    expect(container.querySelector('.account-menu__avatar img')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hapus foto' }));
    expect(await screen.findByText('Foto profil dihapus.')).toBeInTheDocument();
    expect(container.querySelector('.profile-avatar img')).not.toBeInTheDocument();
  });

  it('Keluar mengakhiri sesi dan kembali ke Beranda', async () => {
    const user = userEvent.setup();
    const { router } = openProfile();
    await user.click(within(panel('Keamanan')).getByRole('button', { name: 'Keluar' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/'));
    expect(screen.queryByRole('button', { name: /menu akun/i })).not.toBeInTheDocument();
  });
});
