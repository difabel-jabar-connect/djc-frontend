import { Link } from 'react-router';
import { buildBookingPath, PATHS } from '@/routes/paths';
import { formatRating, formatRupiah } from '@/lib/format';
import { PAYMENT_METHODS } from '@/features/providers/providerProfiles';
import {
  AwardIcon,
  CalendarIcon,
  ClockIcon,
  CreditCardIcon,
  GraduationIcon,
  MapPinIcon,
  MessageIcon,
  ShieldCheckIcon,
  StarFilledIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { SewingBannerArt } from './ProfileArt';

/** Section 3. HEADER PROFIL — kartu identitas penyedia + ringkasan di kanan. */
export default function ProfileHeader({ profile, selectedDate }) {
  const bookingHref = buildBookingPath(profile.id, { tanggal: selectedDate });
  const summary = [
    {
      label: 'Harga mulai',
      value: formatRupiah(profile.priceFrom),
      icon: WalletIcon,
      emphasis: true,
    },
    { label: 'Area layanan', value: profile.serviceAreas.join(', '), icon: MapPinIcon },
    profile.experience && { label: 'Pengalaman', value: profile.experience, icon: AwardIcon },
    {
      label: 'Metode pembayaran',
      value: profile.paymentMethods.map((key) => PAYMENT_METHODS[key].label).join(', '),
      icon: CreditCardIcon,
    },
  ].filter(Boolean);

  return (
    <section className="container profile-top" aria-labelledby="nama-penyedia">
      <div className="profile-card">
        <div className="profile-card__banner">
          <span className="profile-card__alumni-badge">
            <GraduationIcon size={18} />
            Alumni PPSGHD Jawa Barat
          </span>
          {profile.banner === 'jahit' ? (
            <SewingBannerArt />
          ) : (
            <span className="profile-card__banner-icon" aria-hidden="true">
              <img src={profile.categoryIcon} alt="" width="20" height="20" />
            </span>
          )}
          <span
            className="profile-card__avatar"
            style={{ backgroundColor: profile.avatarColor }}
            aria-hidden="true"
          >
            {profile.initials}
          </span>
        </div>

        <div className="profile-card__body">
          <div className="profile-card__identity">
            <div className="profile-card__badges">
              {profile.verified && (
                <span className="pill">
                  <ShieldCheckIcon size={16} strokeWidth={2.25} />
                  Penyedia Layanan Terverifikasi
                </span>
              )}
              {profile.online && (
                <span className="pill pill--success">
                  <span className="status-dot" aria-hidden="true" />
                  Online
                </span>
              )}
            </div>
            <h1 id="nama-penyedia" className="profile-card__name">
              {profile.name}
            </h1>
            <ul className="profile-card__meta">
              <li>
                <StarFilledIcon size={18} className="text-star" />
                <span className="visually-hidden">Rating</span>
                <strong>{formatRating(profile.rating)}</strong>({profile.reviewCount} ulasan)
              </li>
              <li>
                <img src={profile.categoryIcon} alt="" width="18" height="18" />
                <span className="visually-hidden">Kategori: </span>
                {profile.categoryLabel}
              </li>
              <li>
                <MapPinIcon size={18} />
                <span className="visually-hidden">Lokasi: </span>
                {profile.city}, Jawa Barat
              </li>
              {profile.responseTime && (
                <li>
                  <ClockIcon size={18} />
                  {profile.responseTime}
                </li>
              )}
            </ul>
          </div>

          {profile.alumniNote && (
            <div className="profile-card__note">
              <span className="icon-tile icon-tile--primary" aria-hidden="true">
                <GraduationIcon size={22} />
              </span>
              <div>
                <p className="profile-card__note-title">Alumni UPTD PPSGHD Jawa Barat</p>
                <p className="profile-card__note-text">{profile.alumniNote}</p>
              </div>
            </div>
          )}

          <div className="profile-card__actions">
            <Link to={bookingHref} className="btn btn--primary btn--md">
              <CalendarIcon strokeWidth={2.25} />
              Pesan Sekarang
            </Link>
            <Link to={`${PATHS.about}#kontak`} className="btn btn--outline btn--md">
              <MessageIcon strokeWidth={2.25} />
              Hubungi
            </Link>
          </div>
        </div>
      </div>

      <aside className="profile-summary" aria-labelledby="ringkasan-title">
        <h2 id="ringkasan-title" className="side-card__title">
          Ringkasan Profil
        </h2>
        <dl className="profile-summary__list">
          {summary.map(({ label, value, icon: Icon, emphasis }) => (
            <div key={label} className="profile-summary__item">
              <span className="icon-tile" aria-hidden="true">
                <Icon size={22} />
              </span>
              <div>
                <dt>{label}</dt>
                <dd className={emphasis ? 'profile-summary__price' : undefined}>{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}
