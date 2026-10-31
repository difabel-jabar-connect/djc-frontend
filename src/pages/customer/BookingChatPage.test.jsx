import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_ACCOUNTS } from '@/features/auth/session';
import { getThread, sendMessage, unreadCount } from '@/features/chat/chatStore';
import { renderAt } from '@/test/renderWithRouter';

const customer = { user: DEMO_ACCOUNTS.customer };
const provider = { user: DEMO_ACCOUNTS.provider };

describe('Chat pesanan (pelanggan)', () => {
  it('menampilkan riwayat, mengirim pesan, dan menerima balasan secara real-time', async () => {
    const user = userEvent.setup();
    renderAt('/bookings/BK-0011/chat', customer);

    expect(screen.getByRole('heading', { level: 2, name: 'Deni Setiawan' })).toBeInTheDocument();
    const log = within(screen.getByRole('log', { name: 'Deni Setiawan' }));
    expect(log.getByText(/kemungkinan kapasitornya/i)).toBeInTheDocument();
    // Membuka chat menandai balasan penyedia sudah dibaca.
    expect(unreadCount(getThread('BK-0011'), 'customer')).toBe(0);

    const input = screen.getByLabelText('Tulis pesan untuk Deni Setiawan');
    await user.type(input, 'Baik Pak, saya tunggu jam 10.{Enter}');
    expect(log.getByText('Baik Pak, saya tunggu jam 10.')).toBeInTheDocument();
    expect(input).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Kirim pesan' })).toBeDisabled();

    // Balasan dari penyedia (tab lain) langsung tampil tanpa memuat ulang.
    act(() => {
      sendMessage('BK-0011', 'provider', 'Siap, Pak Budi. Saya berangkat 09.30.');
    });
    expect(log.getByText('Siap, Pak Budi. Saya berangkat 09.30.')).toBeInTheDocument();

    // Balasan cepat hanya muncul saat kolom kosong.
    await user.click(screen.getByRole('button', { name: 'Terima kasih!' }));
    expect(log.getByText('Terima kasih!')).toBeInTheDocument();
  });

  it('pesanan yang sudah selesai hanya menampilkan riwayat chat', () => {
    renderAt('/bookings/BK-0009/chat', customer);
    expect(screen.getByText(/pesanan ini sudah ditutup/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('kode pesanan tidak dikenal', () => {
    renderAt('/bookings/BK-9999/chat', customer);
    expect(screen.getByRole('heading', { level: 1, name: 'Chat tidak ditemukan' })).toBeVisible();
  });
});

describe('Chat penyedia', () => {
  it('kotak masuk menampilkan percakapan dan bisa membalas pelanggan', async () => {
    const user = userEvent.setup();
    act(() => {
      sendMessage('BK-0011', 'customer', 'Pak, kipasnya ada dua ya.');
    });
    const { router } = renderAt('/dashboard/provider/chat', provider);

    const nav = within(screen.getByRole('navigation', { name: 'Menu penyedia' }));
    expect(nav.getByRole('link', { name: 'Chat, 1 belum dibaca' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await user.click(screen.getByRole('link', { name: /budi santoso.*1 pesan belum dibaca/i }));
    expect(router.state.location.pathname).toBe('/dashboard/provider/chat/BK-0011');

    const log = within(screen.getByRole('log', { name: 'Budi Santoso' }));
    expect(log.getByText('Pak, kipasnya ada dua ya.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Tulis pesan untuk Budi Santoso'), 'Siap, Pak.');
    await user.click(screen.getByRole('button', { name: 'Kirim pesan' }));
    expect(log.getByText('Siap, Pak.')).toBeInTheDocument();
    expect(getThread('BK-0011').messages.at(-1)).toMatchObject({
      from: 'provider',
      text: 'Siap, Pak.',
    });
  });
});
