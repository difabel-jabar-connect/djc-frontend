/**
 * Chat pelanggan ↔ penyedia per pesanan (pengganti tombol WhatsApp).
 *
 * Real-time tanpa backend: percakapan disimpan di localStorage dan setiap perubahan
 * disiarkan lewat BroadcastChannel (+ event `storage` sebagai cadangan), sehingga pesan
 * langsung muncul di tab/jendela lain (mis. pelanggan di satu tab, penyedia di tab lain).
 * TODO(API): ganti `persist`/`broadcast` dengan WebSocket ke layanan chat backend; bentuk
 * data & fungsi publik di modul ini bisa tetap sama.
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

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      cache = readStorage();
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
    cache = readStorage();
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
  broadcast({ type: 'typing', code, role, active });
}

export const isTyping = (code, role) => typing.has(`${code}:${role}`);

export const getThread = (code) => getState().threads[code] ?? null;

export const lastActivity = (thread) => thread.messages.at(-1)?.at ?? '';

export const threadsForProvider = (providerId) =>
  Object.values(getState().threads)
    .filter((thread) => thread.providerId === providerId)
    .sort((a, b) => lastActivity(b).localeCompare(lastActivity(a)));

/** Jumlah pesan dari pihak lain yang belum dibaca `role`. */
export function unreadCount(thread, role) {
  if (!thread) return 0;
  const since = thread.read?.[role] ?? '';
  return thread.messages.filter((m) => m.from !== role && m.from !== 'system' && m.at > since)
    .length;
}

/** Pesan ini sudah dibaca pihak lawan bicara? */
export function seenByOther(thread, message) {
  const other = message.from === 'customer' ? 'provider' : 'customer';
  const read = thread.read?.[other];
  return Boolean(read && read >= message.at);
}

/** Buat percakapan untuk pesanan baru (dipanggil saat pesanan terkirim). */
export function ensureThread({ code, providerId, providerName, customerName, service }) {
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
export function markRead(code, role) {
  const thread = getThread(code);
  if (!thread || !unreadCount(thread, role)) return;
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
