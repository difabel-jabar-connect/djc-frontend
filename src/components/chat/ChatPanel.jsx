import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DURATION, EASE_OUT } from '@/lib/motion';
import { useChatStore } from '@/features/chat/useChat';
import {
  CHAT_MAX,
  getThread,
  isTyping,
  markRead,
  seenByOther,
  sendMessage,
  sendTyping,
} from '@/features/chat/chatStore';
import { CheckIcon, LockIcon, SendIcon } from '@/components/ui/icons';
import './chat.css';

const TIME = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
const TYPING_THROTTLE_MS = 1500;

const dayKey = (iso) => new Date(iso).toDateString();

function dayLabel(iso) {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hari ini';
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return DAY.format(date);
}

/** Dua centang = dibaca, satu centang = terkirim. */
function Receipt({ seen }) {
  return (
    <span className={`chat-receipt${seen ? ' is-seen' : ''}`}>
      <CheckIcon size={14} strokeWidth={2.75} aria-hidden="true" />
      {seen && <CheckIcon size={14} strokeWidth={2.75} aria-hidden="true" />}
      <span className="visually-hidden">{seen ? 'Dibaca' : 'Terkirim'}</span>
    </span>
  );
}

/**
 * Panel chat real-time satu pesanan. `viewer` = pihak yang sedang memakai ('customer' |
 * 'provider'); `peer` = lawan bicara { name, initials, color, subtitle }.
 * `closed` → hanya riwayat (pesanan selesai/dibatalkan), tanpa kolom tulis pesan.
 */
export default function ChatPanel({ code, viewer, peer, closed = false, quickReplies = [] }) {
  const role = viewer;
  useChatStore();
  const thread = getThread(code);
  const other = role === 'customer' ? 'provider' : 'customer';
  const [text, setText] = useState('');
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const lastTypingRef = useRef(0);
  const nearBottomRef = useRef(true);
  const messages = thread?.messages ?? [];
  const lastId = messages.at(-1)?.id;
  const peerTyping = isTyping(code, other);

  // Pesan masuk saat panel terbuka & tab terlihat → langsung ditandai dibaca.
  useEffect(() => {
    const read = () => {
      if (document.visibilityState !== 'hidden') markRead(code, role);
    };
    read();
    document.addEventListener('visibilitychange', read);
    return () => document.removeEventListener('visibilitychange', read);
  }, [code, role, lastId]);

  // Gulir ke pesan terbaru (kecuali pengguna sedang membaca pesan lama di atas).
  useLayoutEffect(() => {
    const log = logRef.current;
    if (log && nearBottomRef.current) log.scrollTop = log.scrollHeight;
  }, [lastId, peerTyping]);

  const handleScroll = () => {
    const log = logRef.current;
    nearBottomRef.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
  };

  const submit = (value = text) => {
    if (!sendMessage(code, role, value)) return;
    setText('');
    nearBottomRef.current = true;
    inputRef.current?.focus();
  };

  const handleChange = (event) => {
    setText(event.target.value);
    const now = Date.now();
    if (now - lastTypingRef.current > TYPING_THROTTLE_MS) {
      lastTypingRef.current = now;
      sendTyping(code, role, true);
    }
  };

  const handleKeyDown = (event) => {
    // Enter = kirim, Shift+Enter = baris baru (tidak saat sedang memilih kata IME).
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  if (!thread) {
    return (
      <div className="chat chat--empty">
        <p>Memuat percakapan…</p>
      </div>
    );
  }

  let previousDay = '';

  return (
    <div className="chat">
      <header className="chat__head">
        <span className="chat__avatar" style={{ backgroundColor: peer.color }} aria-hidden="true">
          {peer.initials}
        </span>
        <div className="chat__who">
          <h2 className="chat__name" id={`chat-title-${code}`}>
            {peer.name}
          </h2>
          <p className="chat__sub">
            {peerTyping ? (
              <span className="chat__typing-text">sedang mengetik…</span>
            ) : (
              peer.subtitle
            )}
          </p>
        </div>
        <span className="chat__live" title="Pesan baru muncul otomatis tanpa memuat ulang">
          <span className="chat__live-dot" aria-hidden="true" />
          Real-time
        </span>
      </header>

      <div
        ref={logRef}
        className="chat__log"
        role="log"
        aria-live="polite"
        aria-labelledby={`chat-title-${code}`}
        // Area gulir harus bisa difokus agar riwayat bisa digulir dengan keyboard.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        onScroll={handleScroll}
      >
        <ol className="chat__list">
          {/* initial={false}: riwayat lama tidak dianimasikan, hanya pesan yang baru masuk. */}
          <AnimatePresence initial={false}>
            {messages.map((message) => {
              const day = dayKey(message.at);
              const separator = day !== previousDay;
              previousDay = day;
              const mine = message.from === role;
              return (
                <motion.li
                  key={message.id}
                  className="chat__item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: DURATION.base, ease: EASE_OUT }}
                >
                  {separator && (
                    <p className="chat__day">
                      <span>{dayLabel(message.at)}</span>
                    </p>
                  )}
                  {message.from === 'system' ? (
                    <p className="chat__system">{message.text}</p>
                  ) : (
                    <div className={`chat-bubble${mine ? ' chat-bubble--mine' : ''}`}>
                      <span className="visually-hidden">{mine ? 'Anda' : peer.name}: </span>
                      <p className="chat-bubble__text">{message.text}</p>
                      <span className="chat-bubble__meta">
                        <time dateTime={message.at}>{TIME.format(new Date(message.at))}</time>
                        {mine && <Receipt seen={seenByOther(thread, message)} />}
                      </span>
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
        {peerTyping && (
          <div className="chat-bubble chat-bubble--typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      {closed ? (
        <p className="chat__closed">
          <LockIcon size={18} aria-hidden="true" />
          Pesanan ini sudah ditutup. Riwayat chat tetap bisa dibaca.
        </p>
      ) : (
        <form
          className="chat__composer"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {quickReplies.length > 0 && !text && (
            <ul className="chat__quick" aria-label="Balasan cepat">
              {quickReplies.map((reply) => (
                <li key={reply}>
                  <button type="button" className="chat__quick-btn" onClick={() => submit(reply)}>
                    {reply}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="chat__field">
            <label htmlFor={`chat-input-${code}`} className="visually-hidden">
              Tulis pesan untuk {peer.name}
            </label>
            <textarea
              ref={inputRef}
              id={`chat-input-${code}`}
              className="chat__input"
              rows={1}
              maxLength={CHAT_MAX}
              placeholder="Tulis pesan…"
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              aria-describedby={`chat-hint-${code}`}
            />
            <button
              type="submit"
              className="chat__send"
              aria-label="Kirim pesan"
              disabled={!text.trim()}
            >
              <SendIcon size={20} />
            </button>
          </div>
          <p id={`chat-hint-${code}`} className="chat__hint">
            Enter untuk kirim · Shift+Enter untuk baris baru
            {text.length > CHAT_MAX - 200 && ` · ${text.length}/${CHAT_MAX}`}
          </p>
        </form>
      )}
    </div>
  );
}
