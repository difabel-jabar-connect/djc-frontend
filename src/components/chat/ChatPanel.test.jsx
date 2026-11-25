import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getBookingMessages } from '@/features/chat/chatApi';
import { upsertRemoteThread } from '@/features/chat/chatStore';
import ChatPanel from './ChatPanel';

const BOOKING = '0b8f9a3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b';

// Socket.io palsu: menyimpan handler event & membalas ack seperti server.
const fakeSocket = vi.hoisted(() => {
  const handlers = {};
  return {
    connected: true,
    handlers,
    emitted: [],
    on(event, fn) {
      handlers[event] = fn;
    },
    emit(event, payload, ack) {
      fakeSocket.emitted.push({ event, payload });
      ack?.({ ok: true, data: {} });
    },
    timeout() {
      return {
        emit(event, payload, ack) {
          fakeSocket.emitted.push({ event, payload });
          if (event === 'send_message') {
            ack(null, {
              ok: true,
              data: {
                id: `srv-${fakeSocket.emitted.length}`,
                booking_id: payload.booking_id,
                sender_role: 'customer',
                message_text: payload.text,
                is_read: false,
                created_at: new Date().toISOString(),
              },
            });
          } else ack(null, { ok: true, data: {} });
        },
      };
    },
    trigger(event, payload) {
      handlers[event]?.(payload);
    },
  };
});

vi.mock('@/features/chat/socket', () => ({
  connectSocket: () => fakeSocket,
  disconnectSocket: () => {},
}));

vi.mock('@/features/chat/chatApi', () => ({
  getBookingMessages: vi.fn(async () => ({
    booking: { id: BOOKING, code: 'DJC-AAA111', status: 'accepted', can_send: true },
    provider_disability_type: 'tunarungu',
    messages: [
      {
        id: 'm1',
        booking_id: BOOKING,
        sender_role: 'provider',
        message_text: 'Halo, pesanan sudah saya terima.',
        is_read: false,
        created_at: '2026-11-22T04:00:00.000Z',
      },
    ],
    meta: {},
  })),
  sendBookingMessage: vi.fn(),
  markBookingMessagesRead: vi.fn(),
  getChatInbox: vi.fn(async () => []),
}));

const peer = { name: 'Siti Nurjanah', initials: 'SN', color: '#0b3c6e', subtitle: 'Jahit' };

function renderRemote(meta = {}) {
  upsertRemoteThread({ code: 'DJC-AAA111', bookingId: BOOKING, viewer: 'customer', ...meta });
  return render(
    <ChatPanel code="DJC-AAA111" viewer="customer" peer={peer} quickReplies={['Terima kasih!']} />,
  );
}

beforeEach(() => {
  fakeSocket.emitted.length = 0;
});

describe('ChatPanel tersambung ke backend', () => {
  it('memuat riwayat, menampilkan catatan disabilitas, dan mengirim lewat socket', async () => {
    const user = userEvent.setup();
    renderRemote();

    const log = within(await screen.findByRole('log', { name: 'Siti Nurjanah' }));
    expect(log.getByText('Halo, pesanan sudah saya terima.')).toBeInTheDocument();
    expect(screen.getByText(/mitra anda adalah teman tuli/i)).toBeInTheDocument();
    expect(fakeSocket.emitted).toContainEqual({
      event: 'join_room',
      payload: { booking_id: BOOKING },
    });
    // Panel terbuka → pesan masuk ditandai dibaca ke server.
    expect(fakeSocket.emitted.map((e) => e.event)).toContain('mark_read');

    await user.type(
      screen.getByLabelText('Tulis pesan untuk Siti Nurjanah'),
      'Siap, terima kasih.{Enter}',
    );
    expect(fakeSocket.emitted).toContainEqual({
      event: 'send_message',
      payload: { booking_id: BOOKING, text: 'Siap, terima kasih.' },
    });
    expect(await log.findByText('Siap, terima kasih.')).toBeInTheDocument();
  });

  it('pesan dan indikator mengetik dari lawan bicara muncul real-time', async () => {
    renderRemote();
    const log = within(await screen.findByRole('log', { name: 'Siti Nurjanah' }));
    act(() => {
      fakeSocket.trigger('user_typing', { booking_id: BOOKING, role: 'provider', is_typing: true });
    });
    expect(screen.getByText('sedang mengetik…')).toBeInTheDocument();
    act(() => {
      fakeSocket.trigger('new_message', {
        id: 'm9',
        booking_id: BOOKING,
        sender_role: 'provider',
        message_text: 'Saya sudah dekat.',
        is_read: false,
        created_at: new Date().toISOString(),
      });
    });
    expect(log.getByText('Saya sudah dekat.')).toBeInTheDocument();
  });

  it('pesanan yang sudah tidak aktif di server hanya menampilkan riwayat', async () => {
    getBookingMessages.mockResolvedValueOnce({
      booking: { id: BOOKING, code: 'DJC-AAA111', status: 'completed', can_send: false },
      provider_disability_type: null,
      messages: [],
      meta: {},
    });
    renderRemote();
    expect(await screen.findByText(/pesanan ini sudah ditutup/i)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByText(/teman tuli/i)).not.toBeInTheDocument();
  });
});

describe('Ketik dengan suara', () => {
  afterEach(() => {
    delete window.webkitSpeechRecognition;
  });

  it('tombol mikrofon mengisi kolom pesan dari hasil ucapan', async () => {
    const user = userEvent.setup();
    let instance;
    window.webkitSpeechRecognition = class {
      constructor() {
        instance = this;
      }
      start() {}
      stop() {
        this.onend?.();
      }
      abort() {}
    };
    renderRemote();
    await screen.findByRole('log', { name: 'Siti Nurjanah' });

    await user.click(screen.getByRole('button', { name: 'Ketik dengan suara' }));
    expect(instance.lang).toBe('id-ID');
    expect(screen.getByText('Mendengarkan… silakan bicara.')).toBeInTheDocument();
    act(() => {
      instance.onresult({
        results: [Object.assign([{ transcript: 'saya sudah di depan' }], { isFinal: true })],
      });
      instance.onend();
    });
    expect(screen.getByLabelText('Tulis pesan untuk Siti Nurjanah')).toHaveValue(
      'saya sudah di depan',
    );
  });

  it('tidak menampilkan tombol mikrofon bila browser tidak mendukung', async () => {
    renderRemote();
    await screen.findByRole('log', { name: 'Siti Nurjanah' });
    expect(screen.queryByRole('button', { name: 'Ketik dengan suara' })).not.toBeInTheDocument();
  });
});
