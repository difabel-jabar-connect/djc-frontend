import { Link } from 'react-router';
import badgeIcon from '@/assets/icons/hero-badge.svg';
import arrowRightWhite from '@/assets/icons/arrow-right-white.svg';
import { PATHS } from '@/routes/paths';
import HeroIllustration from './HeroIllustration';
import { PopularCategories } from './HeroSearch';

/** Section 2. HERO — setinggi satu layar: judul, tombol Cari Layanan, dan kategori populer. */
export default function HeroSection() {
  return (
    <section className="hero hero--full" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__content">
          <p className="hero__badge">
            <img src={badgeIcon} alt="" width="18" height="18" />
            Talenta Difabel, untuk Jawa Barat yang Lebih Inklusif
          </p>
          <h1 id="hero-title" className="hero__title">
            Temukan Layanan Terpercaya dari{' '}
            <span className="hero__title-accent">Alumni Difabel Jawa Barat</span>
          </h1>
          <p className="hero__lead">
            Satu tempat untuk menemukan dan memesan jasa dari alumni difabel UPTD PPSGHD Jawa Barat:
            dekat dengan Anda, jelas harganya, dan dikerjakan dengan sepenuh hati.
          </p>

          <div className="hero__ctas">
            <Link to={PATHS.services} className="btn btn--primary btn--lg hero__cta-primary">
              Cari Layanan
              <img src={arrowRightWhite} alt="" width="20" height="20" />
            </Link>
          </div>

          <PopularCategories />
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}
