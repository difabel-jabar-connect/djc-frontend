import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCustomer } from '@/context/useCustomer';
import {
  BOOKING_STATUS,
  BOOKING_TABS,
  bookingTotal,
  formatBookingDate,
} from '@/features/booking/customerBookings';
import { getSampleProvider } from '@/features/providers/sampleProviders';
import { formatRupiah } from '@/lib/format';
import { PATHS, buildBookingDetailPath } from '@/routes/paths';
import {
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  InboxIcon,
  RefreshIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { ProviderAvatar, StatusBadge } from './BookingParts';
import './customer.css';

const PAGE_SIZE = 5;

const matchesTab = (booking, tab) => tab === 'semua' || BOOKING_STATUS[booking.status].tab === tab;

function BookingCard({ booking, linkId }) {
  const provider = getSampleProvider(booking.providerId);
  const statusLabel = BOOKING_STATUS[booking.status].label;
  const detailPath = buildBookingDetailPath(booking.code);

  return (
    <li className="booking-card">
      <div className="booking-card__top">
        <span className="booking-code">
          <span className="visually-hidden">Kode pesanan </span>
          {booking.code}
        </span>
        <StatusBadge status={booking.status} />
      </div>

      <div className="booking-card__who">
        <ProviderAvatar provider={provider} />
        <div>
          <h2 className="booking-card__title">
            {/* Seluruh kartu bisa diklik lewat tautan judul (pseudo-elemen meregang). */}
            <Link id={linkId} to={detailPath} className="booking-card__link">
              {booking.service}
              <span className="visually-hidden">
                , {booking.code}, status {statusLabel}
              </span>
            </Link>
          </h2>
          <p className="booking-card__provider">{provider.name} · Penyedia</p>
        </div>
      </div>

      {booking.status === 'menunggu' && booking.autoCancelHours && (
        <p className="booking-card__note">
          <ClockIcon />
          <span>
            Batal otomatis dalam <strong>{booking.autoCancelHours} jam</strong> jika tidak direspons
          </span>
        </p>
      )}

      <div className="booking-card__bottom">
        <div className="booking-card__meta">
          <span>
            <CalendarIcon size={18} />
            {formatBookingDate(booking)}
          </span>
          <span>
            <WalletIcon size={18} />
            Estimasi {formatRupiah(bookingTotal(booking))}
          </span>
        </div>
        <div className="booking-card__actions">
          {booking.status === 'selesai' && !booking.reviewed && (
            <Link
              to={buildBookingDetailPath(booking.code, { ulasan: 'tulis' })}
              className="btn btn--primary"
              aria-label={`Beri ulasan untuk ${provider.name}`}
            >
              Beri Ulasan
            </Link>
          )}
          <Link
            to={detailPath}
            className="btn btn--outline"
            aria-label={`Lihat detail pesanan ${booking.code}`}
          >
            Lihat Detail
          </Link>
        </div>
      </div>
    </li>
  );
}

/** Halaman Pesanan Saya (FR-CUST-08) — daftar pesanan dengan filter status. */
export default function CustomerBookingsPage() {
  useDocumentTitle('Pesanan Saya');
  const { bookings } = useCustomer();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('status');
  const tab = BOOKING_TABS.some((t) => t.value === requested) ? requested : 'semua';
  const [visible, setVisible] = useState({ tab, count: PAGE_SIZE });
  const focusIndexRef = useRef(null);

  // Jumlah tampil kembali ke awal setiap ganti tab.
  const count = visible.tab === tab ? visible.count : PAGE_SIZE;
  const filtered = bookings.filter((b) => matchesTab(b, tab));
  const shown = filtered.slice(0, count);
  const activeTab = BOOKING_TABS.find((t) => t.value === tab);

  useEffect(() => {
    if (focusIndexRef.current === null) return;
    document.getElementById(`booking-link-${focusIndexRef.current}`)?.focus();
    focusIndexRef.current = null;
  }, [count]);

  const selectTab = (value, { focus = false } = {}) => {
    setSearchParams(value === 'semua' ? {} : { status: value }, { replace: true });
    if (focus) document.getElementById(`tab-${value}`)?.focus();
  };

  const handleTabKeyDown = (event) => {
    const index = BOOKING_TABS.findIndex((t) => t.value === tab);
    const last = BOOKING_TABS.length - 1;
    const nextIndex = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    }[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectTab(BOOKING_TABS[nextIndex].value, { focus: true });
  };

  const loadMore = () => {
    focusIndexRef.current = count;
    setVisible({ tab, count: count + PAGE_SIZE });
  };

  return (
    <div className="customer-page">
      <div className="container customer-page__inner">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb breadcrumb--chevron customer-breadcrumb">
            <li>
              <Link to={PATHS.home}>Beranda</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon size={16} />
            </li>
            <li aria-current="page">Pesanan Saya</li>
          </ol>
        </nav>

        <header className="customer-page__head">
          <h1>Pesanan Saya</h1>
          <p>Pantau semua pesanan layanan Anda di satu tempat.</p>
        </header>

        <div className="booking-tabs" role="tablist" aria-label="Filter status pesanan">
          {BOOKING_TABS.map((t) => {
            const selected = t.value === tab;
            const total = bookings.filter((b) => matchesTab(b, t.value)).length;
            return (
              <button
                key={t.value}
                id={`tab-${t.value}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="booking-panel"
                tabIndex={selected ? 0 : -1}
                className="booking-tabs__tab"
                onClick={() => selectTab(t.value)}
                onKeyDown={handleTabKeyDown}
              >
                {t.label}
                <span className="booking-tabs__count">
                  <span className="visually-hidden">, </span>
                  {total}
                  <span className="visually-hidden"> pesanan</span>
                </span>
              </button>
            );
          })}
        </div>

        <div id="booking-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {filtered.length === 0 ? (
            <div className="booking-empty">
              <InboxIcon size={32} />
              <p>
                Belum ada pesanan dengan status <strong>{activeTab.label}</strong>.
              </p>
              <Link to={PATHS.services} className="btn btn--primary">
                Cari Layanan
              </Link>
            </div>
          ) : (
            <ul
              className="booking-list"
              aria-label={`Daftar pesanan, ${shown.length} dari ${filtered.length} ditampilkan`}
            >
              {shown.map((booking, index) => (
                <BookingCard
                  key={booking.code}
                  booking={booking}
                  linkId={`booking-link-${index}`}
                />
              ))}
            </ul>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="booking-more">
            <p aria-live="polite">
              Menampilkan {shown.length} dari {filtered.length} pesanan
            </p>
            {shown.length < filtered.length && (
              <button type="button" className="btn btn--outline btn--lg" onClick={loadMore}>
                <RefreshIcon />
                Muat lebih banyak
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
