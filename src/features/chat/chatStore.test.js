import {
  ensureThread,
  getThread,
  markRead,
  seenByOther,
  sendMessage,
  threadsForProvider,
  unreadCount,
} from './chatStore';

const meta = {
  code: 'BK-0099',
  providerId: 'rizki-maulana',
  providerName: 'Rizki Maulana',
  customerName: 'Budi Santoso',
  service: 'Layanan Kebersihan Rumah',
};

describe('chatStore', () => {
  it('memuat percakapan contoh untuk pesanan demo', () => {
    expect(getThread('BK-0011').providerName).toBe('Deni Setiawan');
    expect(threadsForProvider('deni-setiawan').map((t) => t.code)).toEqual(['BK-0011']);
    // Balasan terakhir penyedia belum dibaca pelanggan.
    expect(unreadCount(getThread('BK-0011'), 'customer')).toBe(1);
  });

  it('ensureThread membuat percakapan baru dengan pesan sistem, sekali saja', () => {
    ensureThread(meta);
    ensureThread(meta);
    const thread = getThread('BK-0099');
    expect(thread.messages).toHaveLength(1);
    expect(thread.messages[0]).toMatchObject({ from: 'system' });
    expect(thread.messages[0].text).toMatch(/terhubung langsung dengan rizki maulana/i);
    expect(unreadCount(thread, 'provider')).toBe(0);
  });

  it('kirim, belum dibaca, lalu dibaca lawan bicara', () => {
    ensureThread(meta);
    expect(sendMessage('BK-0099', 'customer', '   ')).toBeNull();
    const message = sendMessage('BK-0099', 'customer', '  Halo, jadwal Sabtu bisa?  ');
    expect(message.text).toBe('Halo, jadwal Sabtu bisa?');

    let thread = getThread('BK-0099');
    expect(unreadCount(thread, 'provider')).toBe(1);
    expect(unreadCount(thread, 'customer')).toBe(0);
    expect(seenByOther(thread, message)).toBe(false);

    markRead('BK-0099', 'provider');
    thread = getThread('BK-0099');
    expect(unreadCount(thread, 'provider')).toBe(0);
    expect(seenByOther(thread, message)).toBe(true);
  });

  it('menyimpan percakapan di localStorage agar tab lain ikut tersinkron', () => {
    ensureThread(meta);
    sendMessage('BK-0099', 'provider', 'Bisa, Pak.');
    const stored = JSON.parse(localStorage.getItem('djc.chat.v1'));
    expect(stored.threads['BK-0099'].messages.at(-1).text).toBe('Bisa, Pak.');
  });
});
