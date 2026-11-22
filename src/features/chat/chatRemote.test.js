import {
  applyRemoteRead,
  getThread,
  markRead,
  receiveRemoteMessage,
  remoteThreads,
  retryMessage,
  seenByOther,
  sendMessage,
  setChatTransport,
  setRemoteHistory,
  unreadCount,
  upsertRemoteThread,
  clearRemoteThreads,
} from './chatStore';

const BOOKING = '0b8f9a3e-1c2d-4e5f-8a9b-0c1d2e3f4a5b';
const at = (minute) => `2026-11-22T04:${String(minute).padStart(2, '0')}:00.000Z`;
const apiMessage = (id, role, text, minute, isRead = false) => ({
  id,
  booking_id: BOOKING,
  sender_id: `${role}-id`,
  sender_role: role,
  message_text: text,
  is_read: isRead,
  created_at: at(minute),
});

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function openThread() {
  upsertRemoteThread({
    code: 'DJC-AAA111',
    bookingId: BOOKING,
    viewer: 'customer',
    providerName: 'Siti',
    service: 'Jahit',
  });
  setRemoteHistory('DJC-AAA111', [
    apiMessage('m1', 'customer', 'Halo', 1, true),
    apiMessage('m2', 'provider', 'Halo juga', 2, false),
  ]);
}

describe('chatStore: percakapan backend', () => {
  let transport;
  beforeEach(() => {
    transport = {
      send: vi.fn(async (bookingId, text) => apiMessage('m-new', 'customer', text, 5)),
      markRead: vi.fn(async () => ({})),
      typing: vi.fn(),
    };
    setChatTransport(transport);
  });

  it('memuat riwayat API, menghitung belum dibaca, dan tidak menyimpan ke localStorage', () => {
    openThread();
    const thread = getThread('DJC-AAA111');
    expect(thread.messages.map((m) => m.text)).toEqual(['Halo', 'Halo juga']);
    expect(unreadCount(thread, 'customer')).toBe(1);
    expect(seenByOther(thread, thread.messages[0])).toBe(true);
    expect(remoteThreads().map((t) => t.code)).toEqual(['DJC-AAA111']);
    expect(localStorage.getItem('djc.chat.v1') ?? '').not.toContain('DJC-AAA111');
  });

  it('mengirim lewat transport: pesan tertunda diganti pesan dari server', async () => {
    openThread();
    sendMessage('DJC-AAA111', 'customer', 'Saya sudah di lokasi');
    expect(getThread('DJC-AAA111').messages.at(-1)).toMatchObject({ pending: true });
    expect(transport.send).toHaveBeenCalledWith(BOOKING, 'Saya sudah di lokasi');
    await flush();
    const last = getThread('DJC-AAA111').messages.at(-1);
    expect(last).toMatchObject({ id: 'm-new', text: 'Saya sudah di lokasi' });
    expect(last.pending).toBeUndefined();
  });

  it('broadcast new_message untuk pesan sendiri tidak menggandakan pesan', async () => {
    openThread();
    sendMessage('DJC-AAA111', 'customer', 'Saya sudah di lokasi');
    receiveRemoteMessage(apiMessage('m-new', 'customer', 'Saya sudah di lokasi', 5));
    await flush();
    const texts = getThread('DJC-AAA111').messages.map((m) => m.text);
    expect(texts.filter((t) => t === 'Saya sudah di lokasi')).toHaveLength(1);
  });

  it('pesan gagal bisa dikirim ulang', async () => {
    openThread();
    transport.send.mockRejectedValueOnce(new Error('offline'));
    sendMessage('DJC-AAA111', 'customer', 'Coba lagi');
    await flush();
    const failed = getThread('DJC-AAA111').messages.at(-1);
    expect(failed).toMatchObject({ failed: true, text: 'Coba lagi' });
    retryMessage('DJC-AAA111', failed.id);
    await flush();
    expect(getThread('DJC-AAA111').messages.at(-1)).toMatchObject({ id: 'm-new' });
  });

  it('pesan masuk dan tanda dibaca dari server', () => {
    openThread();
    receiveRemoteMessage(apiMessage('m3', 'provider', 'Saya berangkat', 6));
    expect(unreadCount(getThread('DJC-AAA111'), 'customer')).toBe(2);
    markRead('DJC-AAA111', 'customer');
    expect(transport.markRead).toHaveBeenCalledWith(BOOKING);
    expect(unreadCount(getThread('DJC-AAA111'), 'customer')).toBe(0);

    sendMessage('DJC-AAA111', 'customer', 'Oke');
    return flush().then(() => {
      applyRemoteRead(BOOKING, 'provider');
      const mine = getThread('DJC-AAA111').messages.at(-1);
      expect(seenByOther(getThread('DJC-AAA111'), mine)).toBe(true);
    });
  });

  it('ringkasan inbox dipakai sebelum riwayat dimuat, dan dihapus saat keluar akun', () => {
    upsertRemoteThread({ code: 'DJC-BBB222', bookingId: BOOKING, viewer: 'provider', unread: 3 });
    expect(unreadCount(getThread('DJC-BBB222'), 'provider')).toBe(3);
    clearRemoteThreads();
    expect(getThread('DJC-BBB222')).toBeNull();
    // Percakapan demo tetap ada.
    expect(getThread('BK-0011')).not.toBeNull();
  });
});
