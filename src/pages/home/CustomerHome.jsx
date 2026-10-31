import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/context/useAuth';
import { useCustomer } from '@/context/useCustomer';
import {
  findActiveBooking,
  findReviewable,
  formatBookingRange,
  formatDay,
  lastCompletedPerProvider,
} from '@/features/booking/customerBookings';
import { SAMPLE_NEARBY_KM, getSampleProvider } from '@/features/providers/sampleProviders';
import { getCategory } from '@/features/search/catalog';
import { PATHS, buildBookingDetailPath, buildBookingPath } from '@/routes/paths';
import ProviderCard from '@/components/ui/ProviderCard';
import StarRatingInput from '@/components/ui/StarRatingInput';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  ClockSmallIcon,
  HelpCircleIcon,
  MapIcon,
  MapPinIcon,
  MessageIcon,
  PencilIcon,
  RotateCcwIcon,
  StarOutlineIcon,
} from '@/components/ui/icons';
import FeaturedProvidersSection from './FeaturedProvidersSection';
import ServiceMapSection from './ServiceMapSection';
import RouteMapSection from './RouteMapSection';
import AccessibilitySection from './AccessibilitySection';
import SectionHeader from './SectionHeader';
import { HeroSearchForm, PopularCategories } from './HeroSearch';
import './customerHome.css';

const PROGRESS_STEPS = [
  { key: 'menunggu', label: 'Dipesan' },
  { key: 'diterima', label: 'Dikonfirmasi' },
  { key: 'berjalan', label: 'Berlangsung' },
  { key: 'selesai', label: 'Selesai' },
];

/** Progres 4 langkah pesanan aktif (langkah saat ini ditandai aria-current="step"). */
function BookingProgress({ status }) {
  const current = PROGRESS_STEPS.findIndex((step) => step.key === status);
  return (
    <ol className="order-progress" aria-label="Progres pesanan">
      {PROGRESS_STEPS.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li
            key={step.key}
            className={`order-progress__step order-progress__step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="order-progress__marker" aria-hidden="true">
              {state === 'todo' ? index + 1 : <CheckIcon size={16} strokeWidth={3} />}
            </span>
            <span className="order-progress__label">{step.label}</span>
            {state === 'done' && <span className="visually-hidden">selesai</span>}
            {state === 'current' && <span className="order-progress__now">Saat ini</span>}
          </li>
        );
      })}
    </ol>
  );
}

function ActiveBookingCard({ bookings }) {
  const active = findActiveBooking(bookings);
  const waiting = bookings.filter((b) => b.status === 'menunggu').length;

  return (
    <section className="active-order" aria-labelledby="active-order-title">
      <div className="active-order__head">
        <h2 id="active-order-title">
          <span className="active-order__icon" aria-hidden="true">
            <CalendarIcon size={22} />
          </span>
          Pesanan Aktif
        </h2>
        <Link to={PATHS.customerBookings} className="active-order__all">
          Lihat Semua
          <span className="visually-hidden"> pesanan</span>
          <ArrowRightIcon size={16} />
        </Link>
      </div>

      {active ? (
        <ActiveBookingBody booking={active} />
      ) : (
        <p className="active-order__empty">
          Belum ada pesanan yang sedang berjalan. Temukan layanan yang Anda butuhkan lewat pencarian
          di samping.
        </p>
      )}

      {waiting > 0 && (
        <Link to={`${PATHS.customerBookings}?status=menunggu`} className="active-order__waiting">
          <span className="active-order__waiting-count">
            <ClockSmallIcon size={16} strokeWidth={2.25} />
            {waiting}
          </span>
          <span>pesanan {active ? 'lain ' : ''}menunggu konfirmasi</span>
          <ChevronRightIcon size={18} />
        </Link>
      )}
    </section>
  );
}

function ActiveBookingBody({ booking }) {
  const provider = getSampleProvider(booking.providerId);
  const contactable = Boolean(booking.contact?.whatsapp);
  return (
    <>
      <div className="active-order__who">
        <span
          className="booking-avatar"
          style={{ backgroundColor: provider.avatarColor }}
          aria-hidden="true"
        >
          {provider.initials}
        </span>
        <div>
          <p className="active-order__name">{provider.name}</p>
          <p className="active-order__line">
            <BriefcaseIcon size={16} />
            {booking.service}
          </p>
          <p className="active-order__line active-order__line--muted">
            <ClockIcon size={16} />
            {formatBookingRange(booking)}
          </p>
        </div>
        <span className="active-order__status">
          <CheckIcon size={16} strokeWidth={2.5} />
          {booking.status === 'berjalan' ? 'Berlangsung' : 'Dikonfirmasi'}
        </span>
      </div>

      <BookingProgress status={booking.status} />

      <div className="active-order__actions">
        <Link
          to={buildBookingDetailPath(booking.code)}
          className="btn btn--outline"
          aria-label={`Lihat detail pesanan ${booking.code}`}
        >
          Lihat Detail
        </Link>
        {contactable && (
          <a
            href={`https://wa.me/${booking.contact.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn--primary"
            aria-label={`Hubungi ${provider.name} via WhatsApp, membuka aplikasi baru`}
          >
            <MessageIcon size={18} />
            Hubungi
          </a>
        )}
      </div>
    </>
  );
}

function NearbySection({ favorites, onToggleFavorite }) {
  const nearby = Object.entries(SAMPLE_NEARBY_KM)
    .sort(([, a], [, b]) => a - b)
    .map(([id, km]) => ({ provider: getSampleProvider(id), km }));

  return (
    <section className="home-section home-section--tinted" aria-labelledby="nearby-title">
      <div className="container">
        <div className="featured__head">
          <SectionHeader
            id="nearby-title"
            eyebrow="Terdekat dari Anda"
            title="Penyedia Terdekat dari Anda"
            description="Berdasarkan lokasi Anda saat ini."
          />
          <Link to={PATHS.map} className="link-arrow link-arrow--offset">
            <MapIcon size={20} />
            Lihat di Peta
            <ArrowRightIcon size={18} />
          </Link>
        </div>
        <ul className="featured__list">
          {nearby.map(({ provider, km }) => (
            <li key={provider.id}>
              <ProviderCard
                provider={provider}
                distanceKm={km}
                showDistrict
                favorite={favorites.includes(provider.id)}
                onToggleFavorite={onToggleFavorite}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function QuickReview({ booking }) {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const provider = getSampleProvider(booking.providerId);
  const doneAt = booking.history.at(-1).at;

  return (
    <section className="quick-review" aria-labelledby="quick-review-title">
      <h3 id="quick-review-title">
        <StarOutlineIcon size={22} />
        Beri Ulasan
      </h3>
      <div className="quick-review__order">
        <span
          className="booking-avatar"
          style={{ backgroundColor: provider.avatarColor, '--avatar-size': '48px' }}
          aria-hidden="true"
        >
          {provider.initials}
        </span>
        <span>
          <strong>
            {booking.service} – {provider.name}
          </strong>
          <span className="quick-review__done">
            <CheckCircleIcon size={16} strokeWidth={2.25} />
            Selesai {formatDay(doneAt)}
          </span>
        </span>
      </div>
      <fieldset className="quick-review__rating">
        <legend id="quick-review-legend">Bagaimana layanannya?</legend>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          labelledBy="quick-review-legend"
          describe={false}
        />
      </fieldset>
      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() =>
          navigate(buildBookingDetailPath(booking.code, { ulasan: rating || 'tulis' }))
        }
      >
        <PencilIcon size={18} />
        Tulis Ulasan
      </button>
      <p className="quick-review__note">Ulasan Anda membantu alumni difabel berkembang.</p>
    </section>
  );
}

function ActivitySection({ bookings }) {
  const reorders = lastCompletedPerProvider(bookings).slice(0, 3);
  const reviewable = findReviewable(bookings);
  if (!reorders.length && !reviewable) return null;

  return (
    <section className="home-section" aria-labelledby="activity-title">
      <div className="container">
        <SectionHeader
          id="activity-title"
          eyebrow="Aktivitas Anda"
          title="Lanjutkan dari pesanan sebelumnya"
          description="Pesan ulang layanan favorit atau beri ulasan untuk pesanan yang sudah selesai."
        />
        <div className="activity">
          {reorders.length > 0 && (
            <section className="reorder" aria-labelledby="reorder-title">
              <h3 id="reorder-title">
                <RotateCcwIcon size={22} />
                Pesan Lagi
              </h3>
              <ul>
                {reorders.map((booking) => {
                  const provider = getSampleProvider(booking.providerId);
                  const category = getCategory(provider.categorySlug);
                  return (
                    <li key={booking.code}>
                      <span className="reorder__icon" aria-hidden="true">
                        <img src={category?.icon} alt="" width="24" height="24" />
                      </span>
                      <span className="reorder__text">
                        <strong>{booking.service}</strong>
                        <span>
                          {provider.name} · terakhir {formatDay(booking.date)}
                        </span>
                      </span>
                      <Link
                        to={buildBookingPath(provider.id)}
                        className="btn btn--outline"
                        aria-label={`Pesan lagi ${booking.service} dari ${provider.name}`}
                      >
                        Pesan Lagi
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {reviewable && <QuickReview booking={reviewable} />}
        </div>
      </div>
    </section>
  );
}

/** Beranda setelah pelanggan masuk (desain "Beranda — Login"). */
export default function CustomerHome() {
  const { user } = useAuth();
  const { bookings, favorites, toggleFavorite } = useCustomer();
  const [city, setCity] = useState(user.city ?? '');
  const selectRef = useRef(null);

  return (
    <>
      <section className="hero hero--personal" aria-labelledby="hero-title">
        <div className="container hero__inner hero__inner--personal">
          <div className="hero__content">
            <button
              type="button"
              className="hero__location"
              onClick={() => selectRef.current?.focus()}
            >
              <MapPinIcon size={18} strokeWidth={2.25} />
              {city ? `${city}, Jawa Barat` : 'Semua lokasi'} ·{' '}
              <span className="hero__location-change">
                Ubah<span className="visually-hidden"> lokasi</span>
              </span>
            </button>
            <h1 id="hero-title" className="hero__title hero__title--personal">
              <span>Halo, {user.firstName}!</span>
              <span className="hero__title-accent">Butuh layanan apa hari ini?</span>
            </h1>
            <p className="hero__lead">
              Temukan penyedia terdekat dari lokasi Anda dan pesan langsung dalam beberapa langkah.
            </p>
            <HeroSearchForm city={city} onCityChange={setCity} selectRef={selectRef} />
            <PopularCategories />
          </div>
          <ActiveBookingCard bookings={bookings} />
        </div>
      </section>

      <NearbySection favorites={favorites} onToggleFavorite={toggleFavorite} />
      <ActivitySection bookings={bookings} />
      <FeaturedProvidersSection favorites={favorites} onToggleFavorite={toggleFavorite} />
      <ServiceMapSection userCity={city || user.city} />
      <RouteMapSection />
      <AccessibilitySection />

      <section className="container help-banner-wrap" aria-label="Bantuan">
        <div className="help-banner">
          <span className="help-banner__icon" aria-hidden="true">
            <HelpCircleIcon size={26} />
          </span>
          <p>
            <strong>Butuh bantuan memesan?</strong> Lihat panduan atau hubungi kami.
          </p>
          <Link to={PATHS.about} className="btn btn--outline">
            Pusat Bantuan
          </Link>
        </div>
      </section>
    </>
  );
}
