import { Link } from 'react-router';
import { HeartIcon } from '@/components/ui/icons';
import { CATEGORY_PHOTOS } from '@/features/content/photoCredits';
import { usePublicProviders } from '@/features/search/useProviderSearch';

/** Jumlah penyedia unggulan (rating tertinggi dari backend). */
const FEATURED_COUNT = 4;
import { formatRating, formatRupiah } from '@/lib/format';
import { useInViewClass } from '@/hooks/useInViewClass';
import { PATHS, buildBookingPath, buildProviderPath } from '@/routes/paths';

/** Satu penyedia: thumbnail kecil keahlian, nama, rating, harga, dan aksi. */
function ProviderPanel({ provider, index, favorite, onToggleFavorite }) {
  const photo = CATEGORY_PHOTOS[provider.categorySlug];
  const titleId = `unggulan-${provider.id}`;
  return (
    <li className="pick" style={{ '--i': index }}>
      <article className="pick__card" aria-labelledby={titleId}>
        <div className="pick__head">
          {photo ? (
            <img
              className="pick__thumb"
              src={photo.src}
              width="72"
              height="72"
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span
              className="pick__thumb pick__thumb--initials"
              style={{ backgroundColor: provider.avatarColor }}
              aria-hidden="true"
            >
              {provider.initials}
            </span>
          )}
          <div>
            <h3 id={titleId} className="pick__name">
              {provider.name}
            </h3>
            <p className="pick__meta">
              {provider.category} · {provider.city}
            </p>
          </div>
          {onToggleFavorite && (
            <button
              type="button"
              className="pick__favorite"
              aria-label={`Simpan ${provider.name} ke favorit`}
              aria-pressed={Boolean(favorite)}
              onClick={() => onToggleFavorite(provider.id)}
            >
              <HeartIcon size={20} />
            </button>
          )}
        </div>
        <p className="pick__desc">{provider.description}</p>
        <dl className="pick__facts">
          <div>
            <dt>Rating</dt>
            <dd>
              {formatRating(provider.rating)} ({provider.reviewCount})
            </dd>
          </div>
          <div>
            <dt>Mulai dari</dt>
            <dd>
              {formatRupiah(provider.priceFrom)}
              {provider.priceUnit && ` per ${provider.priceUnit}`}
            </dd>
          </div>
        </dl>
        <div className="pick__actions">
          <Link
            to={buildBookingPath(provider.id)}
            className="btn btn--primary"
            aria-label={`Pesan sekarang ke ${provider.name}`}
          >
            Pesan Sekarang
          </Link>
          <Link
            to={buildProviderPath(provider.id)}
            className="pick__link"
            aria-label={`Lihat profil ${provider.name}`}
          >
            Lihat Profil
          </Link>
        </div>
      </article>
    </li>
  );
}

/** Section PENYEDIA UNGGULAN — kisi panel putih yang seragam. Setelah masuk ada tombol favorit. */
export default function FeaturedProvidersSection({ favorites, onToggleFavorite }) {
  const ref = useInViewClass();
  const { status, providers } = usePublicProviders();
  const featured = providers.slice(0, FEATURED_COUNT);
  return (
    <section className="picks" aria-labelledby="featured-title">
      <div className="picks__head">
        <h2 id="featured-title" className="section-title">
          Penyedia Layanan Unggulan
        </h2>
        <Link to={PATHS.services} className="picks__all">
          Lihat Semua Penyedia
        </Link>
      </div>
      {status !== 'success' && (
        <p className="picks__status" role="status">
          {status === 'loading'
            ? 'Memuat penyedia unggulan…'
            : 'Penyedia unggulan belum bisa dimuat. Muat ulang halaman untuk mencoba lagi.'}
        </p>
      )}
      <ul ref={ref} className="picks__list">
        {featured.map((provider, index) => (
          <ProviderPanel
            key={provider.id}
            provider={provider}
            index={index}
            favorite={favorites?.includes(provider.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </ul>
    </section>
  );
}
