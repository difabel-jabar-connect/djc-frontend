import { Link } from 'react-router';
import { formatRating } from '@/lib/format';
import { priceLabel } from '@/features/booking/bookingDraft';
import { buildProviderPath } from '@/routes/paths';
import { CheckBadgeIcon, ClockIcon, MapPinIcon, StarFilledIcon } from '@/components/ui/icons';
import { StepHeading } from './StepParts';

/** Langkah 1 — penyedia & paket layanan. */
export default function StepService({ profile, draft, update }) {
  return (
    <>
      <StepHeading
        step={1}
        title="Pilih Layanan"
        description="Pastikan penyedia dan paket layanan sudah sesuai kebutuhan Anda."
      />

      <section className="booking-card" aria-labelledby="s-penyedia">
        <h3 id="s-penyedia" className="booking-card__title">
          Penyedia Layanan
        </h3>
        <div className="booking-provider">
          <div className="booking-provider__identity">
            <span
              className="booking-provider__avatar"
              style={{ backgroundColor: profile.avatarColor }}
              aria-hidden="true"
            >
              {profile.initials}
            </span>
            <div>
              <p className="booking-provider__name">{profile.name}</p>
              <p className="booking-provider__meta">
                <StarFilledIcon size={16} className="text-star" />
                <span className="visually-hidden">Rating</span>
                <strong>{formatRating(profile.rating)}</strong> ({profile.reviewCount} ulasan) ·{' '}
                {profile.category}
              </p>
              <p className="booking-provider__meta">
                <MapPinIcon size={16} />
                {profile.city}
                {profile.joinedYear ? ` · Bergabung sejak ${profile.joinedYear}` : ''}
              </p>
            </div>
          </div>
          <ul className="booking-provider__highlights">
            {profile.highlights.map((item) => (
              <li key={item}>
                <CheckBadgeIcon />
                {item}
              </li>
            ))}
          </ul>
          <Link to={buildProviderPath(profile.id)} className="btn btn--outline">
            Lihat Profil
          </Link>
        </div>
      </section>

      <fieldset className="booking-card" id="booking-package" tabIndex={-1}>
        <legend className="booking-card__title booking-card__legend">
          Paket Layanan{' '}
          <span className="field-required" aria-hidden="true">
            *
          </span>
          <span className="visually-hidden">(wajib)</span>
        </legend>
        <div className="package-options">
          {profile.packages.map((option) => (
            <label key={option.id} className="option-card">
              <input
                type="radio"
                name="paket"
                value={option.id}
                checked={draft.packageId === option.id}
                onChange={() => update({ packageId: option.id })}
              />
              <strong className="option-card__title">{option.title}</strong>
              <span className="option-card__desc">
                <strong>{priceLabel(option)}</strong> · {option.description}
              </span>
              {option.estimate && (
                <span className="option-card__desc option-card__estimate">
                  <ClockIcon size={16} />
                  {option.estimate}
                </span>
              )}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
