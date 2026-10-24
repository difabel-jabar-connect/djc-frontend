import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCustomer } from '@/context/useCustomer';
import {
  BOOKING_STATUS,
  CANCELLABLE,
  CONTACT_VISIBLE,
  bookingTotal,
  findBooking,
  formatBookingLong,
  formatStamp,
} from '@/features/booking/customerBookings';
import { getSampleProvider } from '@/features/providers/sampleProviders';
import { formatRating, formatRupiah } from '@/lib/format';
import { PATHS, buildBookingPath, buildProviderPath } from '@/routes/paths';
import RatingStars from '@/components/ui/RatingStars';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChatIcon,
  ChevronRightIcon,
  HistoryIcon,
  InfoIcon,
  LockIcon,
  MapPinIcon,
  NoteIcon,
  PencilIcon,
  PhoneIcon,
  ReceiptIcon,
  RotateCcwIcon,
  RouteIcon,
  TagIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { CancelBookingDialog, ReviewDialog } from './BookingDialogs';
import { ProviderAvatar, StatusBadge, StatusIcon } from './BookingParts';
import './customer.css';

const comesToCustomer = (booking) => booking.mode.startsWith('Penyedia datang');

/** Judul & penjelasan banner status (desain Detail Pesanan per status). */
function bannerCopy(booking, provider) {
  const last = booking.history.at(-1);
  switch (booking.status) {
    case 'menunggu':
      return {
        title: 'Menunggu respons penyedia',
        text: `${provider.name} punya waktu ${booking.autoCancelHours ?? 24} jam untuk merespons. Pesanan batal otomatis bila tidak direspons.`,
      };
    case 'diterima':
      return {
        title: 'Penyedia menerima pesanan Anda',
        text: `${provider.name} ${comesToCustomer(booking) ? 'akan datang' : 'siap melayani'} sesuai jadwal. Kontak dan alamat penyedia sekarang bisa dilihat.`,
      };
    case 'berjalan':
      return {
        title: 'Layanan sedang berjalan',
        text: `${provider.name} sedang mengerjakan pesanan Anda. Hubungi penyedia bila ada perubahan.`,
      };
    case 'selesai':
      return {
        title: 'Layanan selesai',
        text: booking.reviewed
          ? `Selesai pada ${formatStamp(last.at)}. Terima kasih sudah memberi ulasan.`
          : `Selesai pada ${formatStamp(last.at)}. Bagikan pengalaman Anda lewat ulasan.`,
      };
    case 'dibatalkan':
      return {
        title: 'Pesanan dibatalkan',
        text: `Dibatalkan oleh ${last.by === 'Anda' ? 'Anda' : 'penyedia'} pada ${formatStamp(last.at)}.${booking.cancelReason ? ` Alasan: “${booking.cancelReason}”` : ''}`,
      };
    case 'ditolak':
      return {
        title: 'Pesanan ditolak penyedia',
        text: `${booking.rejectReason ?? 'Penyedia tidak dapat menerima pesanan ini.'} Coba cari penyedia lain dengan layanan serupa.`,
      };
    default:
      return { title: '', text: '' };
  }
}

const LOCKED_TEXT = {
  menunggu: 'Kontak dan alamat penyedia terbuka setelah penyedia menerima pesanan.',
  selesai:
    'Kontak dan alamat ditutup kembali setelah layanan selesai, untuk menjaga privasi penyedia.',
  dibatalkan: 'Kontak dan alamat tidak ditampilkan untuk pesanan yang dibatalkan.',
  ditolak: 'Kontak dan alamat tidak ditampilkan untuk pesanan yang ditolak.',
};

function DetailRow({ icon: Icon, label, children, note = false }) {
  return (
    <div className="detail-list__row">
      <span className="detail-list__icon" aria-hidden="true">
        <Icon />
      </span>
      <div>
        <dt>{label}</dt>
        <dd className={note ? 'detail-list__note' : undefined}>{children}</dd>
      </div>
    </div>
  );
}

function StatusTimeline({ history }) {
  const items = [...history].reverse();
  return (
    <ol className="timeline">
      {items.map((entry, index) => {
        const latest = index === 0;
        const label =
          entry.status === 'menunggu'
            ? 'Pesanan dibuat · Menunggu respons'
            : BOOKING_STATUS[entry.status].label;
        return (
          <li
            key={`${entry.status}-${entry.at}`}
            className={`timeline__item tone-${BOOKING_STATUS[entry.status].tone}${latest ? ' timeline__item--latest' : ''}`}
          >
            <span className="timeline__dot" aria-hidden="true" />
            <div className="timeline__body">
              <div className="timeline__head">
                <span className="timeline__status">
                  <StatusIcon status={entry.status} size={18} />
                  {label}
                </span>
                <span className={`actor-badge${entry.by === 'Anda' ? ' actor-badge--self' : ''}`}>
                  <span className="visually-hidden">Oleh </span>
                  {entry.by}
                </span>
                {latest && <span className="timeline__latest">· Terbaru</span>}
              </div>
              <time dateTime={entry.at}>{formatStamp(entry.at)}</time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ContactCard({ booking, provider }) {
  const visible = CONTACT_VISIBLE.includes(booking.status) && booking.contact;
  return (
    <section className="detail-card" aria-labelledby="contact-title">
      <h2 id="contact-title" className="contact-card__title">
        Kontak &amp; Lokasi
      </h2>
      {visible ? (
        <>
          <div className="contact-row">
            <span className="contact-row__icon" aria-hidden="true">
              <PhoneIcon />
            </span>
            <div>
              <span className="contact-row__label">Nomor telepon</span>
              <span className="contact-row__phone">{booking.contact.phone}</span>
            </div>
          </div>
          <a
            href={`https://wa.me/${booking.contact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn--primary btn--block"
            aria-label={`Hubungi ${provider.name} via WhatsApp, membuka aplikasi baru`}
          >
            <ChatIcon />
            Hubungi via WhatsApp
          </a>
          <div className="contact-row contact-row--split">
            <span className="contact-row__icon" aria-hidden="true">
              <MapPinIcon />
            </span>
            <div>
              <span className="contact-row__label">Alamat penyedia</span>
              <span className="contact-row__address">{booking.contact.address}</span>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.contact.address)}`}
                target="_blank"
                rel="noreferrer"
              >
                Buka di peta
                <span className="visually-hidden"> (membuka tab baru)</span>
              </a>
            </div>
          </div>
        </>
      ) : (
        <div className="contact-locked">
          <span className="contact-locked__icon" aria-hidden="true">
            <LockIcon strokeWidth={2} />
          </span>
          <div>
            <span className="contact-locked__city">
              <MapPinIcon size={16} />
              {provider.city}, Jawa Barat
            </span>
            <span className="contact-locked__text">
              <span className="visually-hidden">Terkunci. </span>
              {LOCKED_TEXT[booking.status]}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function BookingNotFound({ code }) {
  return (
    <div className="customer-page">
      <div className="container customer-page__inner">
        <div className="booking-empty">
          <XCircleIcon size={32} />
          <h1 className="dialog__title">Pesanan tidak ditemukan</h1>
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

/** Halaman Detail Pesanan pelanggan (desain Detail Pesanan, Batalkan, Beri Ulasan). */
export default function BookingDetailPage() {
  const { code } = useParams();
  const { bookings, cancelBooking, reviewBooking, markRead } = useCustomer();
  const booking = findBooking(bookings, code);
  useDocumentTitle(booking ? `Pesanan ${booking.code}` : 'Pesanan tidak ditemukan');

  const [searchParams, setSearchParams] = useSearchParams();
  const canReview = booking?.status === 'selesai' && !booking.reviewed;
  const askedRating = Number(searchParams.get('ulasan'));
  const [dialog, setDialog] = useState(() =>
    canReview && searchParams.has('ulasan')
      ? { type: 'review', rating: askedRating >= 1 && askedRating <= 5 ? askedRating : 0, key: 1 }
      : { type: null, key: 0 },
  );
  const [flash, setFlash] = useState('');
  const flashRef = useRef(null);

  useEffect(() => {
    if (booking?.unread) markRead(booking.code);
  }, [booking?.unread, booking?.code, markRead]);

  useEffect(() => {
    if (flash) flashRef.current?.focus();
  }, [flash]);

  if (!booking) return <BookingNotFound code={code} />;

  const provider = getSampleProvider(booking.providerId);
  const banner = bannerCopy(booking, provider);
  const tone = BOOKING_STATUS[booking.status].tone;

  const openDialog = (type) => setDialog((d) => ({ type, rating: 0, key: d.key + 1 }));
  const closeDialog = () => {
    setDialog((d) => ({ ...d, type: null }));
    if (searchParams.has('ulasan')) setSearchParams({}, { replace: true });
  };

  const handleCancel = (reason) => {
    cancelBooking(booking.code, reason);
    closeDialog();
    setFlash(`Pesanan ${booking.code} berhasil dibatalkan. Penyedia sudah diberi tahu.`);
  };

  const handleReview = (review) => {
    reviewBooking(booking.code, review);
    closeDialog();
    setFlash(`Terima kasih! Ulasan Anda untuk ${provider.name} sudah terkirim.`);
  };

  return (
    <div className="customer-page">
      <div className="container customer-page__inner customer-page__inner--tight">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb breadcrumb--chevron customer-breadcrumb">
            <li>
              <Link to={PATHS.home}>Beranda</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon size={16} />
            </li>
            <li>
              <Link to={PATHS.customerBookings}>Pesanan Saya</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon size={16} />
            </li>
            <li aria-current="page">{booking.code}</li>
          </ol>
        </nav>

        <Link to={PATHS.customerBookings} className="back-link">
          <ArrowLeftIcon />
          Kembali ke Pesanan Saya
        </Link>

        <div className="booking-detail">
          <div className="booking-detail__main">
            <div className="booking-detail__title">
              <div>
                <h1>
                  <span className="visually-hidden">Detail pesanan </span>
                  {booking.code}
                </h1>
                <StatusBadge status={booking.status} large />
              </div>
              <p className="booking-detail__created">Dibuat {formatStamp(booking.history[0].at)}</p>
            </div>

            {flash && (
              <p ref={flashRef} tabIndex={-1} className="booking-flash" role="status">
                {flash}
              </p>
            )}

            <section className={`status-banner tone-${tone}`} aria-label="Status pesanan">
              <span className="status-banner__icon" aria-hidden="true">
                <StatusIcon status={booking.status} size={30} />
              </span>
              <div className="status-banner__text">
                <p className="status-banner__title">{banner.title}</p>
                <p>{banner.text}</p>
              </div>
            </section>

            <section className="detail-card detail-card--tight" aria-labelledby="detail-service">
              <h2 id="detail-service" className="detail-card__title">
                <span className="detail-card__title-icon" aria-hidden="true">
                  <BriefcaseIcon />
                </span>
                Rincian Layanan
              </h2>
              <dl className="detail-list">
                <DetailRow icon={BriefcaseIcon} label="Nama layanan">
                  {booking.service}
                </DetailRow>
                <DetailRow icon={TagIcon} label="Kategori">
                  {provider.category}
                </DetailRow>
                <DetailRow icon={RouteIcon} label="Mode layanan">
                  {booking.mode}
                </DetailRow>
                <DetailRow icon={CalendarIcon} label="Tanggal & jam">
                  {formatBookingLong(booking)}
                </DetailRow>
                <DetailRow icon={NoteIcon} label="Catatan dari Anda" note>
                  {booking.note ? `“${booking.note}”` : 'Tidak ada catatan.'}
                </DetailRow>
              </dl>
            </section>

            <section className="detail-card" aria-labelledby="detail-cost">
              <h2 id="detail-cost" className="detail-card__title">
                <span className="detail-card__title-icon" aria-hidden="true">
                  <ReceiptIcon />
                </span>
                Rincian Biaya
              </h2>
              <dl className="cost-list">
                <div>
                  <dt>Harga satuan saat dipesan</dt>
                  <dd>
                    {formatRupiah(booking.unitPrice)} / {booking.unit}
                  </dd>
                </div>
                <div>
                  <dt>Jumlah / durasi</dt>
                  <dd>
                    {booking.quantity} {booking.unit}
                  </dd>
                </div>
                <div className="cost-list__divider" aria-hidden="true" />
                <div className="cost-list__total">
                  <dt>Estimasi Total</dt>
                  <dd>{formatRupiah(bookingTotal(booking))}</dd>
                </div>
              </dl>
              <p className="cost-note">
                <InfoIcon />
                <span>Pembayaran dilakukan langsung ke penyedia, di luar platform.</span>
              </p>
            </section>

            <section className="detail-card" aria-labelledby="detail-history">
              <h2 id="detail-history" className="detail-card__title">
                <span className="detail-card__title-icon" aria-hidden="true">
                  <HistoryIcon />
                </span>
                Riwayat Status
              </h2>
              <StatusTimeline history={booking.history} />
            </section>
          </div>

          <aside className="booking-aside" aria-label="Penyedia dan tindakan">
            <section className="detail-card" aria-labelledby="detail-provider">
              <h2 id="detail-provider" className="booking-aside__eyebrow">
                Penyedia
              </h2>
              <div className="provider-mini">
                <ProviderAvatar provider={provider} size={72} />
                <div>
                  <p className="provider-mini__name">{provider.name}</p>
                  <p className="provider-mini__rating">
                    <RatingStars value={provider.rating} />
                    <strong>{formatRating(provider.rating)}</strong>({provider.reviewCount} ulasan)
                  </p>
                </div>
              </div>
              <span className="category-pill">
                <TagIcon size={16} />
                {provider.category}
              </span>
              <Link
                to={buildProviderPath(provider.id)}
                className="link-arrow"
                aria-label={`Lihat profil ${provider.name}`}
              >
                Lihat Profil
                <ArrowRightIcon size={18} />
              </Link>
            </section>

            <ContactCard booking={booking} provider={provider} />

            <div className="booking-aside__actions">
              {CANCELLABLE.includes(booking.status) && (
                <>
                  <button
                    type="button"
                    className="btn btn--danger btn--block"
                    aria-label={`Batalkan pesanan ${booking.code}`}
                    onClick={() => openDialog('cancel')}
                  >
                    <XCircleIcon />
                    Batalkan Pesanan
                  </button>
                  <p className="booking-aside__hint">
                    Pembatalan akan memberi tahu penyedia secara otomatis.
                  </p>
                </>
              )}
              {canReview && (
                <>
                  <button
                    type="button"
                    className="btn btn--primary btn--block"
                    aria-label={`Beri ulasan untuk ${provider.name}`}
                    onClick={() => openDialog('review')}
                  >
                    <PencilIcon />
                    Beri Ulasan
                  </button>
                  <p className="booking-aside__hint">
                    Ulasan bisa diberikan hingga 7 hari setelah layanan selesai.
                  </p>
                </>
              )}
              {booking.status === 'selesai' && booking.reviewed && (
                <p className="booking-aside__hint">
                  {booking.review
                    ? `Ulasan Anda: ${booking.review.rating} dari 5 bintang.`
                    : 'Anda sudah memberi ulasan untuk pesanan ini.'}
                </p>
              )}
              {['selesai', 'dibatalkan', 'ditolak'].includes(booking.status) && (
                <Link
                  to={buildBookingPath(provider.id)}
                  className="btn btn--outline btn--block"
                  aria-label={`Pesan lagi ${booking.service} dari ${provider.name}`}
                >
                  <RotateCcwIcon />
                  Pesan Lagi
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>

      {CANCELLABLE.includes(booking.status) && (
        <CancelBookingDialog
          key={`cancel-${dialog.key}`}
          open={dialog.type === 'cancel'}
          booking={booking}
          provider={provider}
          onClose={closeDialog}
          onConfirm={handleCancel}
        />
      )}
      {canReview && (
        <ReviewDialog
          key={`review-${dialog.key}`}
          open={dialog.type === 'review'}
          booking={booking}
          provider={provider}
          initialRating={dialog.rating}
          onClose={closeDialog}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}
