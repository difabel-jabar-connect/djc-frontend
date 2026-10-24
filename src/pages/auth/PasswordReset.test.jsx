import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { renderAt } from '@/test/renderWithRouter';

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('Lupa Kata Sandi · minta tautan', () => {
  it('memvalidasi email lalu mengirim permintaan dan pindah ke Cek Email', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/lupa-kata-sandi');

    expect(screen.getByRole('heading', { level: 1, name: 'Lupa Kata Sandi?' })).toBeVisible();
    expect(screen.getByText('Saatnya Buat Kata Sandi Baru!')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Kirim Tautan Reset' }));
    expect(screen.getByText('Email wajib diisi.')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/^email/i), 'andi.pratama@gmail.com');
    await user.click(screen.getByRole('button', { name: 'Kirim Tautan Reset' }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/auth/password/forgot');
    expect(JSON.parse(init.body)).toEqual({ email: 'andi.pratama@gmail.com' });
    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe('/lupa-kata-sandi/cek-email'),
    );
    expect(await screen.findByRole('heading', { level: 1, name: 'Cek Email Anda' })).toBeVisible();
    expect(screen.getByText('andi•••@gmail.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /buka aplikasi email/i })).toHaveAttribute(
      'href',
      'https://mail.google.com/',
    );
  });

  it('email tidak terdaftar (404) menampilkan error dengan tautan daftar akun', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: { code: 'EMAIL_NOT_FOUND', message: 'Not found' } }, 404),
        ),
    );
    const user = userEvent.setup();
    renderAt('/lupa-kata-sandi');

    await user.type(screen.getByLabelText(/^email/i), 'andi@mail.com');
    await user.click(screen.getByRole('button', { name: 'Kirim Tautan Reset' }));

    expect(await screen.findByText(/email tidak terdaftar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText(/^email/i)).toHaveAccessibleDescription(/email tidak terdaftar/i);
    expect(screen.getByRole('link', { name: 'Daftar akun' })).toHaveAttribute('href', '/register');
  });
});

describe('Lupa Kata Sandi · cek email', () => {
  afterEach(() => vi.useRealTimers());

  it('kirim ulang baru aktif setelah hitung mundur 60 detik', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const { router } = renderAt('/lupa-kata-sandi');
    await act(() =>
      router.navigate('/lupa-kata-sandi/cek-email', { state: { email: 'andi@gmail.com' } }),
    );

    const resend = screen.getByRole('button', { name: 'Kirim ulang' });
    expect(resend).toBeDisabled();
    expect(resend).toHaveAccessibleDescription('tersedia dalam (00:59)');

    for (let i = 0; i < 59; i += 1) {
      act(() => vi.advanceTimersByTime(1000));
    }
    expect(resend).toBeEnabled();
    expect(screen.queryByText(/00:/)).not.toBeInTheDocument();

    await act(async () => resend.click());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(/tautan baru sudah dikirim/i);
    expect(resend).toBeDisabled();
  });
});

describe('Lupa Kata Sandi · atur ulang', () => {
  it('tombol simpan aktif setelah semua syarat terpenuhi dan konfirmasi cocok', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { router } = renderAt('/reset-kata-sandi?token=abc123');

    const submit = screen.getByRole('button', { name: 'Simpan Kata Sandi' });
    const requirements = () =>
      screen.getByRole('list', { name: 'Syarat kata sandi' }).querySelectorAll('li.is-met').length;
    expect(submit).toBeDisabled();

    const baru = screen.getByLabelText(/^kata sandi baru/i);
    await user.type(baru, 'JabarInklusif');
    expect(requirements()).toBe(2);
    expect(screen.getByText(/kekuatan:/i)).toHaveTextContent('Sedang');
    expect(baru).toHaveAccessibleDescription(/mengandung angka\s*belum/i);

    await user.type(baru, '2026');
    expect(requirements()).toBe(3);
    expect(screen.getByText(/kekuatan:/i)).toHaveTextContent('Kuat');

    const ulang = screen.getByLabelText(/^konfirmasi kata sandi baru/i);
    await user.type(ulang, 'JabarInklusif');
    expect(screen.getByText('Kata sandi tidak sama')).toBeInTheDocument();
    expect(ulang).toHaveAttribute('aria-invalid', 'true');
    expect(submit).toBeDisabled();

    await user.type(ulang, '2026');
    expect(screen.getByRole('status')).toHaveTextContent('Kata sandi cocok');
    expect(submit).toBeEnabled();

    await user.click(submit);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/api/v1/auth/password/reset');
    expect(JSON.parse(init.body)).toEqual({ token: 'abc123', password: 'JabarInklusif2026' });
    await vi.waitFor(() =>
      expect(router.state.location.pathname).toBe('/reset-kata-sandi/berhasil'),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Kata Sandi Berhasil Diubah!' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /masuk sekarang/i })).toHaveAttribute('href', '/login');
  });

  it('tautan kedaluwarsa (410) menampilkan peringatan dan tombol kirim ulang', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ error: { code: 'TOKEN_EXPIRED', message: 'Expired' } }, 410),
        ),
    );
    const user = userEvent.setup();
    renderAt('/reset-kata-sandi?token=lama');

    await user.type(screen.getByLabelText(/^kata sandi baru/i), 'Jabar2026Inklusif');
    await user.type(screen.getByLabelText(/^konfirmasi kata sandi baru/i), 'Jabar2026Inklusif');
    await user.click(screen.getByRole('button', { name: 'Simpan Kata Sandi' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tautan sudah kedaluwarsa');
    expect(screen.getByRole('link', { name: 'Kirim Ulang Tautan' })).toHaveAttribute(
      'href',
      '/lupa-kata-sandi',
    );
  });

  it('tanpa token langsung menampilkan tautan tidak berlaku', () => {
    renderAt('/reset-kata-sandi');
    expect(screen.getByRole('alert')).toHaveTextContent('Tautan sudah kedaluwarsa');
  });
});
