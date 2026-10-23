import { Link } from 'react-router';
import arrowRight from '@/assets/icons/arrow-right.svg';
import ProviderCard from '@/components/ui/ProviderCard';
import { FEATURED_PROVIDERS } from '@/features/providers/featuredProviders';
import { PATHS } from '@/routes/paths';
import SectionHeader from './SectionHeader';

/** Section 3. PENYEDIA UNGGULAN */
export default function FeaturedProvidersSection() {
  return (
    <section className="home-section home-section--tinted" aria-labelledby="featured-title">
      <div className="container">
        <div className="featured__head">
          <SectionHeader
            id="featured-title"
            eyebrow="Pilihan pengguna"
            title="Penyedia Layanan Unggulan"
            description="Alumni difabel dengan ulasan terbaik dari masyarakat Jawa Barat."
          />
          <Link to={PATHS.services} className="link-arrow">
            Lihat Semua Penyedia
            <img src={arrowRight} alt="" width="20" height="20" />
          </Link>
        </div>
        <ul className="featured__list">
          {FEATURED_PROVIDERS.map((provider) => (
            <li key={provider.id}>
              <ProviderCard provider={provider} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
