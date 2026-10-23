import { Link } from 'react-router';
import { getCategory } from '@/features/search/catalog';
import { buildProviderPath } from '@/routes/paths';
import { formatRating, formatRupiah } from '@/lib/format';
import { MapPinIcon, StarFilledIcon } from './icons';
import './ServiceCard.css';

/** Kartu hasil pencarian layanan (desain HTML Cari Layanan › KIRI: hasil). */
export default function ServiceCard({ provider, headingLevel = 3 }) {
  const Heading = `h${headingLevel}`;
  const category = getCategory(provider.categorySlug);
  const profilePath = buildProviderPath(provider.id);

  return (
    <article className="service-card">
      <div className="service-card__top">
        <span
          className="service-card__avatar"
          style={{ backgroundColor: provider.avatarColor }}
          aria-hidden="true"
        >
          {provider.initials}
        </span>
        {category && (
          <span className="service-card__category">
            <img src={category.icon} alt="" width="16" height="16" />
            <span className="visually-hidden">Kategori: </span>
            {category.label}
          </span>
        )}
      </div>

      <div className="service-card__info">
        <Heading className="service-card__name">{provider.name}</Heading>
        <p className="service-card__meta">
          <StarFilledIcon size={16} className="service-card__star" />
          <span className="visually-hidden">Rating</span>
          <strong>{formatRating(provider.rating)}</strong>({provider.reviewCount} ulasan)
        </p>
        <p className="service-card__meta">
          <MapPinIcon size={16} />
          <span className="visually-hidden">Lokasi: </span>
          {provider.city}
        </p>
      </div>

      <p className="service-card__desc">{provider.description}</p>

      <p className="service-card__price">
        <span className="service-card__price-label">Mulai dari</span>
        <span className="service-card__price-value">
          {formatRupiah(provider.priceFrom)}
          {provider.priceUnit && (
            <span className="service-card__price-unit">/{provider.priceUnit}</span>
          )}
        </span>
      </p>

      <div className="service-card__actions">
        <Link
          to={profilePath}
          className="btn btn--outline btn--block"
          aria-label={`Lihat profil ${provider.name}`}
        >
          Lihat Profil
        </Link>
        <Link
          to={`${profilePath}#pesan`}
          className="btn btn--primary btn--block"
          aria-label={`Pesan layanan ${provider.name}`}
        >
          Pesan
        </Link>
      </div>
    </article>
  );
}
