import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import captionIcon from '@/assets/icons/map-caption.svg';
import statProvidersIcon from '@/assets/icons/stat-providers.svg';
import statCitiesIcon from '@/assets/icons/stat-cities.svg';
import statCategoriesIcon from '@/assets/icons/stat-categories.svg';
import arrowRight from '@/assets/icons/arrow-right.svg';
import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import { PATHS } from '@/routes/paths';
import SectionHeader from './SectionHeader';

// Leaflet cukup besar: dimuat terpisah saat Beranda dibuka.
const ProviderMap = lazy(() => import('@/pages/services/ProviderMap'));

const count = (key) => new Set(SAMPLE_PROVIDERS.map((p) => p[key])).size;

const STATS = [
  { value: String(SAMPLE_PROVIDERS.length), label: 'Penyedia layanan', icon: statProvidersIcon },
  { value: String(count('city')), label: 'Kota/kabupaten terjangkau', icon: statCitiesIcon },
  { value: String(count('categorySlug')), label: 'Kategori layanan', icon: statCategoriesIcon },
];

/**
 * Section 2. PETA SEBARAN — peta SIG Jawa Barat (sama dengan Cari Layanan) dengan pin harga
 * tiap penyedia sesuai alamatnya. Klik pin → kartu penyedia (Lihat Profil / Pesan).
 */
export default function ServiceMapSection() {
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <section className="home-section" aria-labelledby="map-title">
      <div className="container service-map">
        <figure className="service-map__figure">
          <div className="service-map__sig">
            <Suspense fallback={<div className="pm pm--loading">Memuat peta…</div>}>
              <ProviderMap
                providers={SAMPLE_PROVIDERS}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                selectedId={selectedId}
                onSelect={setSelectedId}
                scrollZoom={false}
              />
            </Suspense>
          </div>
          <figcaption className="service-map__caption">
            <img src={captionIcon} alt="" width="18" height="18" />
            Klik pin harga untuk melihat penyedia · gunakan tombol + / − untuk memperbesar
          </figcaption>
        </figure>

        <div className="service-map__info">
          <SectionHeader
            id="map-title"
            eyebrow="Jangkauan layanan"
            title="Peta Sebaran Layanan"
            description="Penyedia layanan tersebar di berbagai kota dan kabupaten di Jawa Barat. Temukan yang paling dekat dengan Anda langsung di peta."
          />
          <ul className="stat-list">
            {STATS.map((stat) => (
              <li key={stat.label} className="stat-list__item">
                <span className="stat-list__icon">
                  <img src={stat.icon} alt="" width="24" height="24" />
                </span>
                <span className="stat-list__text">
                  <strong className="stat-list__value">{stat.value}</strong>
                  <span className="stat-list__label">{stat.label}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link to={PATHS.services} className="link-arrow">
            Cari di Peta Lengkap
            <span className="visually-hidden"> pada halaman Cari Layanan</span>
            <img src={arrowRight} alt="" width="20" height="20" />
          </Link>
        </div>
      </div>
    </section>
  );
}
