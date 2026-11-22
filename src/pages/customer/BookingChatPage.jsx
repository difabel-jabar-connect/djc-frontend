import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/useAuth';
import { useCustomer } from '@/context/useCustomer';
import { findBooking, formatBookingRange } from '@/features/booking/customerBookings';
import { CHAT_OPEN_STATUSES, ensureThread, getThread } from '@/features/chat/chatStore';
import { isBackendId, useChatInbox } from '@/features/chat/chatSync';
import { useChatStore } from '@/features/chat/useChat';
import { bookingProvider } from '@/features/booking/bookingProvider';
import { PATHS, buildBookingDetailPath, buildProviderPath } from '@/routes/paths';
import ChatPanel from '@/components/chat/ChatPanel';
import { ArrowLeftIcon, BriefcaseIcon, ClockIcon, XCircleIcon } from '@/components/ui/icons';
import { ProviderAvatar, StatusBadge } from './BookingParts';
import './customer.css';

const QUICK_REPLIES = [
  'Halo, apakah jadwalnya sesuai?',
  'Saya sudah di lokasi.',
  'Mohon kabari jika sudah dekat.',
  'Terima kasih!',
];

const initialsOf = (name = '') =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');

/** Chat pesanan backend yang hanya diketahui dari inbox (detail pesanan belum dimuat). */
function RemoteOnlyChat({ thread }) {
  const name = thread.providerName ?? 'Penyedia';
  return (
    <div className="customer-page chat-page">
      <div className="container chat-page__inner">
        <div className="chat-page__top">
          <Link to={PATHS.customerBookings} className="chat-page__back">
            <ArrowLeftIcon size={18} />
            Pesanan Saya
          </Link>
          <h1 className="visually-hidden">Chat dengan {name}</h1>
        </div>
        <ChatPanel
          code={thread.code}
          viewer="customer"
          peer={{
            name,
            initials: initialsOf(name),
            color: '#0b3c6e',
            subtitle: `Pesanan ${thread.code}${thread.service ? ` · ${thread.service}` : ''}`,
          }}
          closed={!['requested', 'accepted', 'in_progress'].includes(thread.status)}
          quickReplies={QUICK_REPLIES}
        />
      </div>
    </div>
  );
}

/** Chat real-time pelanggan dengan penyedia untuk satu pesanan (pengganti WhatsApp). */
export default function BookingChatPage() {
  const { code } = useParams();
  const { user } = useAuth();
  const { bookings } = useCustomer();
  const booking = findBooking(bookings, code);
  const provider = booking ? bookingProvider(booking) : null;
  useChatStore();
  // Pesanan dari backend yang belum ada di data lokal (mis. setelah muat ulang) → cari di inbox.
  useChatInbox('customer', !booking && isBackendId(user?.id));
  const inboxThread = !booking ? getThread(code) : null;
  const remoteOnly = inboxThread?.bookingId ? inboxThread : null;
  const peerName = provider?.name ?? remoteOnly?.providerName;
  useDocumentTitle(peerName ? `Chat dengan ${peerName}` : 'Chat tidak ditemukan');

  // Pesanan tanpa riwayat chat (mis. data lama) → buka percakapan baru.
  // Pesanan dari backend (id UUID) → percakapan tersambung ke server chat.
  useEffect(() => {
    if (!booking || !provider) return;
    ensureThread({
      code: booking.code,
      bookingId: isBackendId(booking.id) ? booking.id : undefined,
      providerId: provider.id,
      providerName: provider.name,
      customerName: user.name,
      service: booking.service,
      viewer: 'customer',
    });
  }, [booking, provider, user.name]);

  if (remoteOnly) {
    return <RemoteOnlyChat thread={remoteOnly} />;
  }

  if (!booking || !provider) {
    return (
      <div className="customer-page">
        <div className="container customer-page__inner">
          <div className="booking-empty">
            <XCircleIcon size={32} />
            <h1 className="dialog__title">Chat tidak ditemukan</h1>
            <p>
              Tidak ada pesanan dengan kode <strong>{code}</strong> di akun Anda.
            </p>
            <Link to={PATHS.customerBookings} className="btn btn--primary">
              Kembali ke Pesanan Saya
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const closed = !CHAT_OPEN_STATUSES.includes(booking.status);

  return (
    <div className="customer-page chat-page">
      <div className="container chat-page__inner">
        <div className="chat-page__top">
          <Link to={buildBookingDetailPath(booking.code)} className="chat-page__back">
            <ArrowLeftIcon size={18} />
            Detail Pesanan {booking.code}
          </Link>
          <h1 className="visually-hidden">Chat dengan {provider.name}</h1>
        </div>

        <div className="chat-page__grid">
          <ChatPanel
            code={booking.code}
            viewer="customer"
            peer={{
              name: provider.name,
              initials: provider.initials,
              color: provider.avatarColor,
              subtitle: `${provider.category} · ${provider.city}`,
            }}
            closed={closed}
            quickReplies={QUICK_REPLIES}
            disabilityType={provider.disabilityType ?? provider.disability}
          />

          <aside className="chat-page__aside detail-card" aria-label="Pesanan terkait">
            <div className="provider-mini">
              <ProviderAvatar provider={provider} size={56} />
              <div>
                <p className="provider-mini__name">{provider.name}</p>
                <Link to={buildProviderPath(provider.id)} className="chat-page__link">
                  Lihat profil
                </Link>
              </div>
            </div>
            <dl className="chat-page__facts">
              <div>
                <dt>Kode pesanan</dt>
                <dd>
                  {booking.code} <StatusBadge status={booking.status} />
                </dd>
              </div>
              <div>
                <dt>
                  <BriefcaseIcon size={16} aria-hidden="true" /> Layanan
                </dt>
                <dd>{booking.service}</dd>
              </div>
              <div>
                <dt>
                  <ClockIcon size={16} aria-hidden="true" /> Jadwal
                </dt>
                <dd>{formatBookingRange(booking)} WIB</dd>
              </div>
            </dl>
            <p className="chat-page__note">
              Demi keamanan, lakukan semua komunikasi dan kesepakatan lewat chat ini. Jangan
              membagikan kata sandi atau kode OTP.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
