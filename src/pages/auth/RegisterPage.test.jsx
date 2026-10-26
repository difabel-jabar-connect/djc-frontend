import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function fillCommon(user, { password = 'Rahasia123!' } = {}) {
  await user.type(screen.getByLabelText(/nama lengkap/i), 'Rina Amalia');
  await user.type(screen.getByLabelText(/^email/i), 'rina.amalia@gmail.com');
  await user.type(screen.getByLabelText(/nomor whatsapp/i), '081234567890');
  await user.type(screen.getByLabelText(/^kata sandi/i), password);
  await user.type(screen.getByLabelText(/^konfirmasi kata sandi/i), password);
  await user.click(screen.getByRole('checkbox', { name: /saya menyetujui/i }));
}

describe('Halaman Daftar', () => {
  it('default Pengguna; ?peran=mitra memilih Mitra dan menampilkan field tambahan', () => {
    renderAt('/register');
    expect(screen.getByRole('radio', { name: 'Pengguna' })).toBeChecked();
    expect(screen.queryByLabelText(/kota\/kabupaten domisili/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daftar' })).toBeInTheDocument();
  });

  it('beralih ke Mitra menampilkan nomor alumni, kota, kategori, dan catatan verifikasi', async () => {
    const user = userEvent.setup();
    renderAt('/register');
    await user.click(screen.getByRole('radio', { name: /mitra penyedia layanan/i }));
    expect(screen.getByLabelText(/nomor alumni uptd ppsghd/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kota\/kabupaten domisili/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kategori keahlian/i)).toBeInTheDocument();
    expect(screen.getByText(/khusus alumni uptd ppsghd/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Daftar sebagai Mitra' })).toBeInTheDocument();
  });

  it('memvalidasi isian dan memfokuskan field pertama yang salah', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    renderAt('/register?peran=mitra');

    await user.click(screen.getByRole('button', { name: 'Daftar sebagai Mitra' }));
    expect(screen.getByText('Nama lengkap wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Nomor alumni UPTD PPSGHD wajib diisi.')).toBeInTheDocument();
    expect(screen.getByText('Pilih kategori keahlian.')).toBeInTheDocument();
    expect(screen.getByText(/perlu menyetujui/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toHaveFocus();

    await user.type(screen.getByLabelText(/^kata sandi/i), 'abc');
    await user.type(screen.getByLabelText(/^konfirmasi kata sandi/i), 'abd');
    expect(screen.getByText('Kata sandi minimal 8 karakter.')).toBeInTheDocument();
    expect(screen.getByText('Konfirmasi kata sandi tidak sama.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('menampilkan kekuatan kata sandi', async () => {
    const user = userEvent.setup();
    renderAt('/register');
    expect(screen.getByText(/kekuatan sandi/i)).toHaveTextContent('belum diisi');
    await user.type(screen.getByLabelText(/^kata sandi/i), 'abcdefg1');
    expect(screen.getByText(/kekuatan sandi/i)).toHaveTextContent('sedang');
    await user.type(screen.getByLabelText(/^kata sandi/i), '!');
    expect(screen.getByText(/kekuatan sandi/i)).toHaveTextContent('kuat');
  });

  it('daftar Mitra mengirim data lalu menampilkan halaman berhasil', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: { id: 7 } }, 201));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/register?peran=mitra');

    await fillCommon(user);
    await user.type(screen.getByLabelText(/nomor alumni uptd ppsghd/i), ' PPSGHD-2024-007 ');
    await user.selectOptions(screen.getByLabelText(/kota\/kabupaten domisili/i), 'Kota Depok');
    await user.selectOptions(screen.getByLabelText(/kategori keahlian/i), 'jahit');
    await user.click(screen.getByRole('button', { name: 'Daftar sebagai Mitra' }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/auth/register');
    expect(JSON.parse(init.body)).toEqual({
      role: 'provider',
      full_name: 'Rina Amalia',
      email: 'rina.amalia@gmail.com',
      phone: '+6281234567890',
      password: 'Rahasia123!',
      alumni_reg_no: 'PPSGHD-2024-007',
      city: 'Kota Depok',
      category: 'jahit',
    });
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/register/berhasil'));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pendaftaran Berhasil!' }),
    ).toBeVisible();
    expect(screen.getByText('rina•••@gmail.com')).toBeInTheDocument();
    expect(screen.getByText(/menunggu verifikasi pengelola/i)).toBeInTheDocument();
  });

  it('daftar Pengguna tidak menampilkan kotak khusus Mitra; email terdaftar → pesan 409', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          jsonResponse({ error: { code: 'EMAIL_TAKEN', message: 'Email exists' } }, 409),
        )
        .mockResolvedValueOnce(jsonResponse({ data: { id: 8 } }, 201)),
    );
    const user = userEvent.setup();
    renderAt('/register');
    await fillCommon(user);

    await user.click(screen.getByRole('button', { name: 'Daftar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/email ini sudah terdaftar/i);

    await user.click(screen.getByRole('button', { name: 'Daftar' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Pendaftaran Berhasil!' }),
    ).toBeVisible();
    expect(screen.queryByText(/menunggu verifikasi pengelola/i)).not.toBeInTheDocument();
  });
});

describe('Halaman Daftar — error validasi dari server', () => {
  it('menampilkan pesan per field dari details lalu memfokuskan field pertama', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Data yang dikirim belum valid.',
              details: [
                { field: 'phone', message: 'Nomor HP harus berformat +62, mis. +6281234567890.' },
                { field: 'full_name', message: 'Nama lengkap minimal 2 karakter.' },
              ],
            },
          },
          400,
        ),
      ),
    );
    const user = userEvent.setup();
    renderAt('/register');
    await fillCommon(user);
    await user.click(screen.getByRole('button', { name: 'Daftar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/periksa kembali isian/i);
    expect(screen.getByText('Nama lengkap minimal 2 karakter.')).toBeInTheDocument();
    expect(screen.getByText(/nomor hp harus berformat \+62/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nama lengkap/i)).toHaveFocus();
  });
});

describe('Halaman Pendaftaran Berhasil', () => {
  it('dibuka langsung tanpa data pendaftaran menampilkan teks umum', () => {
    renderAt('/register/berhasil');
    expect(screen.getByText(/buka email tersebut untuk mengaktifkan akun/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /kirim ulang/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /masuk sekarang/i })).toHaveAttribute('href', '/login');
  });
});
