import { Link } from 'react-router';
import { buildBookingPath, buildProviderPath } from '@/routes/paths';
import { formatRating, formatRupiah } from '@/lib/format';
import StarIcon from './StarIcon';
import LocationIcon from './LocationIcon';
import { HeartIcon, MapPinIcon } from './icons';
import './ProviderCard.css';

const kmFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });

/**
 * Kartu ringkas penyedia jasa (Figma: Section 3 › List › Item).
 * Opsional (Beranda setelah masuk): `distanceKm` (jarak dari pengguna), lokasi dengan
 * kecamatan, dan tombol favorit (`favorite` + `onToggleFavorite`).
 */
export default function ProviderCard({
  provider,
  headingLevel = 3,
  distanceKm,
  showDistrict = false,
  favorite,
  onToggleFavorite,
}) {
  const Heading = `h${headingLevel}`;
  const profilePath = buildProviderPath(provider.id);
  const location =
    showDistrict && provider.district ? `${provider.district}, ${provider.city}` : provider.city;

  return (
    <article className={`provider-card${onToggleFavorite ? ' provider-card--favoritable' : ''}`}>
      {onToggleFavorite && (
        <button
          type="button"
          className="provider-card__favorite"
          aria-label={`Simpan ${provider.name} ke favorit`}
          aria-pressed={Boolean(favorite)}
          onClick={() => onToggleFavorite(provider.id)}
        >
          <HeartIcon size={22} />
        </button>
      )}
      <div className="provider-card__head">
        <span
          className="provider-card__avatar"
          style={{ backgroundColor: provider.avatarColor }}
          aria-hidden="true"
        >
          {provider.initials}
        </span>
        <div>
          <Heading className="provider-card__name">{provider.name}</Heading>
          <p className="provider-card__rating">
            <StarIcon />
            <span className="visually-hidden">Rating</span>
            <strong>{formatRating(provider.rating)}</strong>
            <span className="provider-card__reviews">({provider.reviewCount} ulasan)</span>
          </p>
        </div>
      </div>

      {distanceKm !== undefined && (
        <p className="provider-card__distance">
          <MapPinIcon size={16} strokeWidth={2.25} />
          {kmFormatter.format(distanceKm)} km dari Anda
        </p>
      )}

      <ul className="provider-card__meta">
        <li className="provider-card__category">
          <span className="provider-card__category-icon">
            <img src={provider.categoryIcon} alt="" width="20" height="20" />
          </span>
          <span className="visually-hidden">Kategori: </span>
          {provider.category}
        </li>
        <li className="provider-card__city">
          <span className="provider-card__city-icon">
            <LocationIcon />
          </span>
          <span className="visually-hidden">Lokasi: </span>
          {location}
        </li>
      </ul>

      <p className="provider-card__price">
        <span className="provider-card__price-label">Mulai dari</span>
        <span>
          <strong className="provider-card__price-value">{formatRupiah(provider.priceFrom)}</strong>
          {provider.priceUnit && (
            <span className="provider-card__price-unit">/{provider.priceUnit}</span>
          )}
        </span>
      </p>

      <div className="provider-card__actions">
        <Link
          to={profilePath}
          className="btn btn--outline btn--block"
          aria-label={`Lihat profil ${provider.name}`}
        >
          Lihat Profil
        </Link>
        <Link
          to={buildBookingPath(provider.id)}
          className="btn btn--primary btn--block"
          aria-label={`Pesan sekarang ke ${provider.name}`}
        >
          Pesan Sekarang
        </Link>
      </div>
    </article>
  );
}
