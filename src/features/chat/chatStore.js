/**
 * Chat pelanggan ↔ penyedia per pesanan (pengganti tombol WhatsApp).
 *
 * Dua jenis percakapan memakai bentuk data & fungsi publik yang sama:
 * - Percakapan backend (`thread.bookingId` = UUID booking): riwayat dari
 *   GET /bookings/:id/messages, pesan/typing/dibaca lewat Socket.io (lihat `chatSync.js`).
 *   Hanya disimpan di memori, tidak ditulis ke localStorage.
 * - Percakapan demo (pesanan contoh tanpa UUID): disimpan di localStorage dan disiarkan
 *   lewat BroadcastChannel (+ event `storage`) supaya tetap jalan tanpa backend.
 */

export const CHAT_MAX = 1000;
const STORAGE_KEY = 'djc.chat.v1';
const CHANNEL_NAME = 'djc-chat';
export const TYPING_TIMEOUT_MS = 3500;

/** Status pesanan yang chat-nya masih bisa dibalas; selain itu hanya riwayat. */
export const CHAT_OPEN_STATUSES = ['menunggu', 'diterima', 'berjalan'];

const stamp = (date) => date.toISOString();
const ago = (minutes) => stamp(new Date(Date.now() - minutes * 60_000));

/** Percakapan contoh untuk pesanan demo yang sudah diterima/berjalan. */
function seedThreads() {
  return {
    'BK-0011': {
      code: 'BK-0011',
      providerId: 'deni-setiawan',
      providerName: 'Deni Setiawan',
      customerName: 'Budi Santoso',
      service: 'Servis Elektronik',
      messages: [
        {
          id: 's-0011-1',
          from: 'system',
          text: 'Pesanan BK-0011 diterima. Chat ini terhubung langsung dengan penyedia.',
          at: ago(60 * 26),
        },
        {
          id: 's-0011-2',
          from: 'provider',
          text: 'Selamat sore Pak Budi, saya Deni. Pesanan servis kipas anginnya sudah saya terima. Boleh dikirim foto kipasnya?',
          at: ago(60 * 25),
        },
        {
          id: 's-0011-3',
          from: 'customer',
          text: 'Sore Pak Deni. Kipas berdiri, mau nyala tapi tidak berputar dan bunyi mendengung.',
          at: ago(60 * 24),
        },
        {
          id: 's-0011-4',
          from: 'provider',
          text: 'Kemungkinan kapasitornya, Pak. Saya bawa sparepart-nya sekalian ya. Sampai jumpa sesuai jadwal.',
          at: ago(45),
        },
      ],
      read: { customer: ago(60 * 24), provider: ago(60 * 24) },
    },
    'BK-0010': {
      code: 'BK-0010',
      providerId: 'agus-setiawan',
      providerName: 'Agus Setiawan',
      customerName: 'Budi Santoso',
      service: 'Desain Grafis',
      messages: [
        {
          id: 's-0010-1',
          from: 'system',
          text: 'Pesanan BK-0010 diterima. Chat ini terhubung langsung dengan penyedia.',
          at: ago(60 * 72),
        },
        {
          id: 's-0010-2',
          from: 'provider',
          text: 'Halo Pak Budi, draf pertama logo usaha kuenya sedang saya kerjakan. Hasilnya saya kirim lewat chat ini besok pagi.',
          at: ago(60 * 20),
        },
      ],
      read: { customer: ago(60 * 72), provider: ago(60 * 20) },
    },
  };
}

// ---------- penyimpanan & siaran ----------

let cache = null;
let snapshot = null;
const listeners = new Set();
let channel = null;
const typing = new Map(); // `${code}:${role}` → id timeout
let typingVersion = 0;

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Penyimpanan diblokir/rusak → mulai dari data contoh (hanya di memori).
  }
  return { threads: seedThreads() };
}

const isRemote = (thread) => Boolean(thread?.bookingId);

/** Percakapan backend tidak ikut disimpan; hanya percakapan demo. */
function localPart(state) {
  const threads = Object.fromEntries(
    Object.entries(state.threads).filter(([, thread]) => !isRemote(thread)),
  );
  return { ...state, threads };
}

/** Muat ulang percakapan demo dari penyimpanan tanpa membuang percakapan backend. */
function reloadLocal() {
  const fresh = readStorage();
  const remote = Object.fromEntries(
    Object.entries(cache?.threads ?? {}).filter(([, thread]) => isRemote(thread)),
  );
  cache = { ...fresh, threads: { ...fresh.threads, ...remote } };
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(localPart(state)));
  } catch {
    // Penyimpanan diblokir: percakapan tetap ada di memori tab ini.
  }
}

function notify() {
  listeners.forEach((listener) => listener());
}

function setTypingLocal(code, role, active) {
  const key = `${code}:${role}`;
  clearTimeout(typing.get(key));
  if (active) {
    typing.set(
      key,
      setTimeout(() => setTypingLocal(code, role, false), TYPING_TIMEOUT_MS),
    );
  } else if (!typing.delete(key)) {
    return;
  }
  typingVersion += 1;
  notify();
}

function getChannel() {
  if (channel || typeof BroadcastChannel !== 'function') return channel;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = ({ data }) => {
    if (data?.type === 'update') {
      reloadLocal();
      notify();
    } else if (data?.type === 'typing') {
      setTypingLocal(data.code, data.role, data.active);
    }
  };
  return channel;
}

function broadcast(message) {
  try {
    getChannel()?.postMessage(message);
  } catch {
    // Kanal tertutup: tab lain tetap tersinkron lewat event `storage`.
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY) return;
    reloadLocal();
    notify();
  });
}

function getState() {
  if (!cache) {
    cache = readStorage();
    getChannel();
  }
  return cache;
}

function commit(update) {
  const next = update(getState());
  cache = next;
  persist(next);
  notify();
  broadcast({ type: 'update' });
}

/** Perubahan percakapan backend: cukup di memori, tidak disimpan/disiarkan antartab. */
function commitRemote(update) {
  cache = update(getState());
  notify();
}

function patchThread(code, patch) {
  commitRemote((state) => {
    const thread = state.threads[code];
    if (!thread) return state;
    const next = typeof patch === 'function' ? patch(thread) : { ...thread, ...patch };
    return { ...state, threads: { ...state.threads, [code]: next } };
  });
}

// ---------- jalur ke backend (diisi oleh chatSync.js) ----------

/**
 * `transport` = { send(bookingId, text) → Promise<pesan API>, markRead(bookingId),
 * typing(bookingId, active) }. Dipasang oleh `chatSync.js` supaya modul ini tidak
 * bergantung langsung pada Socket.io (dan tetap mudah dites).
 */
let transport = null;

export function setChatTransport(next) {
  transport = next;
}

/** Ubah pesan API ({ sender_role, message_text, ... }) ke bentuk pesan di store. */
export function fromApiMessage(raw) {
  return {
    id: raw.id,
    from: raw.sender_role || 'system',
    text: raw.message_text,
    at: raw.created_at,
    isRead: Boolean(raw.is_read),
  };
}

const byTime = (a, b) => String(a.at).localeCompare(String(b.at));

/**
 * Daftarkan/perbarui percakapan backend. `viewer` = peran pengguna yang login.
 * Field lain (nama, layanan, status, jenis disabilitas mitra, ringkasan inbox) opsional.
 */
export function upsertRemoteThread({ code, bookingId, ...meta }) {
  if (!code || !bookingId) return;
  const defined = Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined));
  commitRemote((state) => {
    const current = state.threads[code];
    const base = current?.bookingId
      ? current
      : { code, bookingId, messages: [], read: {}, loaded: false };
    return {
      ...state,
      threads: { ...state.threads, [code]: { ...base, ...defined, code, bookingId } },
    };
  });
}

export const findThreadByBooking = (bookingId) =>
  Object.values(getState().threads).find((thread) => thread.bookingId === bookingId) ?? null;

/** Ganti isi percakapan backend dengan riwayat dari API (pesan tertunda tetap dipertahankan). */
export function setRemoteHistory(code, rawMessages, meta = {}) {
  patchThread(code, (thread) => {
    const fromApi = rawMessages.map(fromApiMessage);
    const ids = new Set(fromApi.map((m) => m.id));
    const pending = thread.messages.filter((m) => m.pending && !ids.has(m.id));
    return {
      ...thread,
      ...meta,
      loaded: true,
      messages: [...fromApi, ...pending].sort(byTime),
    };
  });
}

/** Pesan baru dari server (event `new_message`, atau hasil kirim). */
export function receiveRemoteMessage(raw) {
  const thread = findThreadByBooking(raw.booking_id);
  if (!thread) return;
  const message = fromApiMessage(raw);
  patchThread(thread.code, (current) => {
    if (current.messages.some((m) => m.id === message.id)) return current;
    // Pesan milik sendiri yang masih tertunda → ganti dengan versi dari server.
    const pendingIndex = current.messages.findIndex(
      (m) => m.pending && m.from === message.from && m.text === message.text,
    );
    const messages = [...current.messages];
    if (pendingIndex >= 0) messages.splice(pendingIndex, 1, message);
    else messages.push(message);
    return {
      ...current,
      messages: messages.sort(byTime),
      lastMessage: message,
      unread:
        current.viewer && message.from !== current.viewer && message.from !== 'system'
          ? (current.unread ?? 0) + 1
          : current.unread,
    };
  });
}

/** Event `messages_read`: pesan dari pihak lain sudah dibaca oleh `readerRole`. */
export function applyRemoteRead(bookingId, readerRole) {
  const thread = findThreadByBooking(bookingId);
  if (!thread) return;
  patchThread(thread.code, (current) => ({
    ...current,
    unread: readerRole === current.viewer ? 0 : current.unread,
    messages: current.messages.map((m) =>
      m.from !== readerRole && m.from !== 'system' && !m.pending ? { ...m, isRead: true } : m,
    ),
  }));
}

/** Event `user_typing` dari server. */
export function applyRemoteTyping(bookingId, role, active) {
  const thread = findThreadByBooking(bookingId);
  if (thread) setTypingLocal(thread.code, role, active);
}

/** Buang semua percakapan backend dari memori (mis. saat keluar akun). */
export function clearRemoteThreads() {
  if (!cache) return;
  commitRemote((state) => localPart(state));
}

/** Semua percakapan backend, terbaru di atas. */
export const remoteThreads = () =>
  Object.values(getState().threads)
    .filter(isRemote)
    .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));

// ---------- API publik ----------

export function subscribe(listener) {
  listeners.add(listener);
  getState();
  return () => listeners.delete(listener);
}

/** Snapshot untuk useSyncExternalStore (identitas berubah hanya saat ada perubahan). */
export function getSnapshot() {
  const state = getState();
  if (!snapshot || snapshot.state !== state || snapshot.typingVersion !== typingVersion) {
    snapshot = { state, typingVersion };
  }
  return snapshot;
}

/** Siarkan ke tab lain bahwa `role` sedang (atau berhenti) mengetik di percakapan `code`. */
export function sendTyping(code, role, active = true) {
  const thread = getThread(code);
  if (isRemote(thread)) {
    transport?.typing(thread.bookingId, active);
    return;
  }
  broadcast({ type: 'typing', code, role, active });
}

export const isTyping = (code, role) => typing.has(`${code}:${role}`);

export const getThread = (code) => getState().threads[code] ?? null;

export const lastActivity = (thread) => thread.messages.at(-1)?.at ?? thread.lastMessage?.at ?? '';

export const threadsForProvider = (providerId) =>
  Object.values(getState().threads)
    .filter((thread) => thread.providerId === providerId)
    .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));

/** Jumlah pesan dari pihak lain yang belum dibaca `role`. */
export function unreadCount(thread, role) {
  if (!thread) return 0;
  if (isRemote(thread)) {
    if (!thread.loaded) return thread.unread ?? 0;
    return thread.messages.filter((m) => m.from !== role && m.from !== 'system' && !m.isRead)
      .length;
  }
  const since = thread.read?.[role] ?? '';
  return thread.messages.filter((m) => m.from !== role && m.from !== 'system' && m.at > since)
    .length;
}

/** Pesan ini sudah dibaca pihak lawan bicara? */
export function seenByOther(thread, message) {
  if (isRemote(thread)) return Boolean(message.isRead);
  const other = message.from === 'customer' ? 'provider' : 'customer';
  const read = thread.read?.[other];
  return Boolean(read && read >= message.at);
}

/** Buat percakapan untuk pesanan baru (dipanggil saat pesanan terkirim). */
export function ensureThread({
  code,
  bookingId,
  providerId,
  providerName,
  customerName,
  service,
  viewer = 'customer',
  ...meta
}) {
  if (bookingId) {
    upsertRemoteThread({
      code,
      bookingId,
      providerId,
      providerName,
      customerName,
      service,
      viewer,
      ...meta,
    });
    return;
  }
  if (getThread(code)) return;
  const now = stamp(new Date());
  commit((state) => ({
    ...state,
    threads: {
      ...state.threads,
      [code]: {
        code,
        providerId,
        providerName,
        customerName,
        service,
        messages: [
          {
            id: `${code}-sys-${Date.now()}`,
            from: 'system',
            text: `Pesanan ${code} terkirim. Chat ini terhubung langsung dengan ${providerName}.`,
            at: now,
          },
        ],
        read: { customer: now, provider: '' },
      },
    },
  }));
}

/** Kirim pesan; mengembalikan pesan yang tersimpan, atau null bila teks kosong. */
export function sendMessage(code, from, text) {
  const body = String(text).trim().slice(0, CHAT_MAX);
  const thread = getThread(code);
  if (!body || !thread) return null;
  if (isRemote(thread)) return sendRemote(thread, from, body);
  const message = {
    id: `${code}-${from}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from,
    text: body,
    at: stamp(new Date()),
  };
  commit((state) => ({
    ...state,
    threads: {
      ...state.threads,
      [code]: {
        ...thread,
        messages: [...thread.messages, message],
        read: { ...thread.read, [from]: message.at },
      },
    },
  }));
  sendTyping(code, from, false);
  return message;
}

/** Tandai percakapan sudah dibaca `role` (memunculkan tanda "Dibaca" di sisi lawan). */
function sendRemote(thread, from, body) {
  const message = {
    id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    from,
    text: body,
    at: stamp(new Date()),
    pending: true,
  };
  patchThread(thread.code, (current) => ({
    ...current,
    messages: [...current.messages, message],
  }));
  transport?.typing(thread.bookingId, false);
  const markFailed = () =>
    patchThread(thread.code, (current) => ({
      ...current,
      messages: current.messages.map((m) =>
        m.id === message.id ? { ...m, pending: false, failed: true } : m,
      ),
    }));
  if (!transport) {
    markFailed();
    return message;
  }
  Promise.resolve(transport.send(thread.bookingId, body))
    .then((saved) => {
      if (!saved?.id) return;
      patchThread(thread.code, (current) => {
        const exists = current.messages.some((m) => m.id === saved.id);
        const messages = exists
          ? current.messages.filter((m) => m.id !== message.id)
          : current.messages.map((m) => (m.id === message.id ? fromApiMessage(saved) : m));
        return { ...current, messages, lastMessage: fromApiMessage(saved) };
      });
    })
    .catch(markFailed);
  return message;
}

/** Kirim ulang pesan yang gagal terkirim ke backend. */
export function retryMessage(code, messageId) {
  const thread = getThread(code);
  const failed = thread?.messages.find((m) => m.id === messageId && m.failed);
  if (!failed) return null;
  patchThread(code, (current) => ({
    ...current,
    messages: current.messages.filter((m) => m.id !== messageId),
  }));
  return sendRemote(getThread(code), failed.from, failed.text);
}

export function markRead(code, role) {
  const thread = getThread(code);
  if (!thread || !unreadCount(thread, role)) return;
  if (isRemote(thread)) {
    patchThread(code, (current) => ({
      ...current,
      unread: 0,
      messages: current.messages.map((m) =>
        m.from !== role && m.from !== 'system' ? { ...m, isRead: true } : m,
      ),
    }));
    Promise.resolve(transport?.markRead(thread.bookingId)).catch(() => {});
    return;
  }
  const latest = thread.messages.at(-1).at;
  commit((state) => ({
    ...state,
    threads: {
      ...state.threads,
      [code]: { ...thread, read: { ...thread.read, [role]: latest } },
    },
  }));
}

/** Untuk test: kosongkan cache, indikator mengetik, dan penyimpanan. */
export function resetChatStore() {
  cache = null;
  snapshot = null;
  typing.forEach((timeout) => clearTimeout(timeout));
  typing.clear();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // abaikan
  }
}
