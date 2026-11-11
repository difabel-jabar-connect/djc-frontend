import { Link, useParams } from 'react-router';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ChatPanel from '@/components/chat/ChatPanel';
import { ChatIcon } from '@/components/ui/icons';
import { lastActivity, threadsForProvider, unreadCount } from '@/features/chat/chatStore';
import { useChatStore } from '@/features/chat/useChat';
import { PROVIDER_ID, sampleOrders } from '@/features/dashboard/providerDashboardData';
import { getProviderProfile } from '@/features/providers/providerProfiles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { buildProviderChatPath, buildProviderPath } from '@/routes/paths';
import { providerNavItems } from './providerNav';
import './providerChat.css';

const COLORS = ['#0b3c6e', '#0b6b67', '#26324a', '#3d5a80', '#3d5a80', '#0b3c6e'];
const TIME = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });
const DAY = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' });

const initialsOf = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

const colorOf = (name) => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 6];

function shortTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toDateString() === new Date().toDateString() ? TIME.format(date) : DAY.format(date);
}

const QUICK_REPLIES = [
  'Baik, pesanan saya terima.',
  'Saya sedang menuju lokasi.',
  'Mohon kirim foto barangnya.',
  'Pekerjaan sudah selesai, terima kasih!',
];

/** Kotak masuk chat penyedia: daftar percakapan per pesanan + panel chat real-time. */
export default function ProviderChatPage() {
  useDocumentTitle('Chat Pelanggan');
  const { code } = useParams();
  useChatStore();
  const profile = getProviderProfile(PROVIDER_ID);
  const threads = threadsForProvider(PROVIDER_ID);
  const active = threads.find((thread) => thread.code === code) ?? null;
  const chatUnread = threads.reduce((sum, thread) => sum + unreadCount(thread, 'provider'), 0);
  const newCount = sampleOrders().filter((o) => o.status === 'baru').length;

  return (
    <DashboardShell
      subtitle="Talenta Difabel, Jabar Inklusif"
      navLabel="Menu penyedia"
      navItems={providerNavItems({ page: 'chat', newCount, chatUnread })}
      user={{
        name: profile.name,
        initials: profile.initials,
        role: 'Penyedia Layanan',
        color: '#0b3c6e',
      }}
      userMenuItems={[{ label: 'Lihat Profil Publik', to: buildProviderPath(PROVIDER_ID) }]}
      sidebarNote={{ text: 'Bersama Mewujudkan Jawa Barat yang Lebih Inklusif' }}
    >
      <div className={`pchat${active ? ' has-active' : ''}`}>
        <section className="pchat__inbox" aria-labelledby="pchat-title">
          <div className="pchat__head">
            <h1 id="pchat-title">Chat Pelanggan</h1>
            <p>Balas pertanyaan pelanggan langsung dari sini, pesan masuk secara real-time.</p>
          </div>
          {threads.length ? (
            <ul className="pchat__list">
              {threads.map((thread) => {
                const unread = unreadCount(thread, 'provider');
                const last = thread.messages.at(-1);
                const preview = last.from === 'provider' ? `Anda: ${last.text}` : last.text;
                return (
                  <li key={thread.code}>
                    <Link
                      to={buildProviderChatPath(thread.code)}
                      className={`pchat__thread${thread.code === code ? ' is-active' : ''}${unread ? ' is-unread' : ''}`}
                      aria-current={thread.code === code ? 'page' : undefined}
                      aria-label={`${thread.customerName}, ${thread.service}, pesanan ${thread.code}${unread ? `, ${unread} pesan belum dibaca` : ''}`}
                    >
                      <span
                        className="pchat__avatar"
                        style={{ backgroundColor: colorOf(thread.customerName) }}
                        aria-hidden="true"
                      >
                        {initialsOf(thread.customerName)}
                      </span>
                      <span className="pchat__summary">
                        <span className="pchat__row">
                          <strong>{thread.customerName}</strong>
                          <time dateTime={lastActivity(thread)}>
                            {shortTime(lastActivity(thread))}
                          </time>
                        </span>
                        <span className="pchat__service">
                          {thread.code} · {thread.service}
                        </span>
                        <span className="pchat__row">
                          <span className="pchat__preview">{preview}</span>
                          {unread > 0 && (
                            <span className="pchat__badge" aria-hidden="true">
                              {unread}
                            </span>
                          )}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="pchat__empty">Belum ada percakapan dengan pelanggan.</p>
          )}
        </section>

        <div className="pchat__main">
          {active ? (
            <>
              <Link to={buildProviderChatPath()} className="pchat__back">
                ← Semua percakapan
              </Link>
              <ChatPanel
                key={active.code}
                code={active.code}
                viewer="provider"
                peer={{
                  name: active.customerName,
                  initials: initialsOf(active.customerName),
                  color: colorOf(active.customerName),
                  subtitle: `Pesanan ${active.code} · ${active.service}`,
                }}
                quickReplies={QUICK_REPLIES}
              />
            </>
          ) : (
            <div className="pchat__placeholder">
              <ChatIcon size={40} aria-hidden="true" />
              <p>
                {code
                  ? `Percakapan ${code} tidak ditemukan.`
                  : 'Pilih percakapan di samping untuk mulai membalas.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
