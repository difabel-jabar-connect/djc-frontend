import { Link } from 'react-router';
import { buildBookingPath } from '@/routes/paths';
import { formatRating, formatRupiah } from '@/lib/format';
import RatingStars from '@/components/ui/RatingStars';
import {
  ArrowRightIcon,
  CheckBadgeIcon,
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  QuoteIcon,
  StarOutlineIcon,
  XIcon,
} from '@/components/ui/icons';
import { PackageArt } from './ProfileArt';

/** a. Tentang */
export function AboutSection({ profile }) {
  return (
    <section id="tentang" className="profile-section" aria-labelledby="tentang-title">
      <h2 id="tentang-title" className="profile-section__title">
        Tentang {profile.name}
      </h2>
      {profile.about.map((paragraph) => (
        <p key={paragraph} className="profile-section__text">
          {paragraph}
        </p>
      ))}
      {profile.quote && (
        <figure className="profile-quote">
          <QuoteIcon className="profile-quote__icon" />
          <div>
            <blockquote>{profile.quote}</blockquote>
            <figcaption>{profile.name}</figcaption>
          </div>
        </figure>
      )}
    </section>
  );
}

/** b. Statistik layanan */
export function StatsSection({ profile }) {
  const stats = [
    profile.stats.completed && {
      value: profile.stats.completed,
      label: 'Pesanan Selesai',
      icon: CircleCheckIcon,
    },
    profile.stats.onTime && { value: profile.stats.onTime, label: 'Tepat Waktu', icon: ClockIcon },
    { value: formatRating(profile.rating), label: 'Rating Layanan', icon: StarOutlineIcon },
  ].filter(Boolean);

  return (
    <section aria-label="Statistik layanan">
      <ul className="profile-stats">
        {stats.map(({ value, label, icon: Icon }) => (
          <li key={label} className="profile-stats__item">
            <span className="icon-tile icon-tile--lg" aria-hidden="true">
              <Icon size={26} />
            </span>
            <span className="profile-stats__text">
              <strong>{value}</strong>
              {label}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** c. Jadwal ketersediaan 7 hari ke depan — memilih hari meneruskan tanggal ke pemesanan. */
export function ScheduleSection({ profile, days, selectedDate, onSelectDate }) {
  const first = days[0];
  const last = days[days.length - 1];

  return (
    <section id="jadwal" className="profile-section" aria-labelledby="jadwal-title">
      <div className="profile-section__head">
        <h2 id="jadwal-title" className="profile-section__title">
          Jadwal Ketersediaan
        </h2>
        <Link
          to={buildBookingPath(profile.id, { tanggal: selectedDate })}
          className="link-arrow link-arrow--offset"
        >
          Lihat Jadwal Lengkap
          <ArrowRightIcon />
        </Link>
      </div>
      <div
        role="group"
        aria-label={`Pilih hari layanan, ${first.label} sampai ${last.label}`}
        className="week-days"
      >
        {days.map((day) =>
          day.available ? (
            <button
              key={day.iso}
              type="button"
              className="week-day"
              aria-pressed={selectedDate === day.iso}
              onClick={() => onSelectDate(selectedDate === day.iso ? '' : day.iso)}
            >
              <span className="week-day__name">{day.weekday}</span>
              <span className="week-day__date">{day.label}</span>
              {selectedDate === day.iso ? (
                <span className="week-day__status week-day__status--selected">
                  <CheckBadgeIcon size={16} />
                  Dipilih
                </span>
              ) : (
                <span className="week-day__status week-day__status--open">
                  <CheckIcon size={16} />
                  Tersedia
                </span>
              )}
            </button>
          ) : (
            <button
              key={day.iso}
              type="button"
              className="week-day"
              disabled
              aria-label={`${day.weekday} ${day.label}, tidak tersedia`}
            >
              <span className="week-day__name">{day.weekday}</span>
              <span className="week-day__date">{day.label}</span>
              <span className="week-day__status week-day__status--closed">
                <XIcon size={16} />
                Libur
              </span>
            </button>
          ),
        )}
      </div>
      <div className="info-note">
        <ClockIcon size={22} className="info-note__icon" />
        <div>
          <p className="info-note__title">Jam layanan: {profile.hours}</p>
          <p className="info-note__text">
            Waktu dapat berubah, silakan konfirmasi terlebih dahulu.
          </p>
        </div>
      </div>
    </section>
  );
}

/** d. Paket layanan */
export function PackagesSection({ profile, selectedDate }) {
  return (
    <section id="layanan" className="profile-section" aria-labelledby="paket-title">
      <h2 id="paket-title" className="profile-section__title">
        Paket Layanan
      </h2>
      <ul className="card-grid">
        {profile.packages.map((pkg) => (
          <li key={pkg.id} className="package-card">
            <div className="package-card__art" aria-hidden="true">
              <PackageArt art={pkg.art} fallbackIcon={profile.categoryIcon} />
            </div>
            <div className="package-card__head">
              <h3 className="package-card__title">{pkg.title}</h3>
              <p className="package-card__price">
                Mulai dari <strong>{formatRupiah(pkg.priceFrom)}</strong>
                {pkg.priceUnit === 'jam' && <span>/jam</span>}
              </p>
            </div>
            <p className="package-card__desc">{pkg.description}</p>
            <Link
              to={buildBookingPath(profile.id, { paket: pkg.id, tanggal: selectedDate })}
              className="btn btn--outline btn--block package-card__cta"
              aria-label={`Pilih layanan ${pkg.title}`}
            >
              Pilih Layanan
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** e. Ulasan pelanggan */
export function ReviewsSection({ profile }) {
  return (
    <section id="ulasan" className="profile-section" aria-labelledby="ulasan-title">
      <div className="profile-section__head">
        <h2 id="ulasan-title" className="profile-section__title">
          Ulasan Pelanggan
        </h2>
      </div>
      {profile.reviews.length ? (
        <ul className="card-grid">
          {profile.reviews.map((review) => (
            <li key={review.id} className="review-card">
              <div className="review-card__author">
                <span
                  className="review-card__avatar"
                  style={{ backgroundColor: review.color }}
                  aria-hidden="true"
                >
                  {review.initials}
                </span>
                <span>
                  <strong>{review.name}</strong>
                  <span className="review-card__when">{review.when}</span>
                </span>
              </div>
              <RatingStars value={review.rating} />
              <p className="review-card__text">{review.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="profile-section__empty">
          Belum ada ulasan tertulis untuk penyedia ini. Rating {formatRating(profile.rating)} dari{' '}
          {profile.reviewCount} pelanggan.
        </p>
      )}
    </section>
  );
}
