import { Link, useNavigate } from 'react-router';
import badgeIcon from '@/assets/icons/hero-badge.svg';
import searchIcon from '@/assets/icons/search.svg';
import searchWhiteIcon from '@/assets/icons/search-white.svg';
import locationIcon from '@/assets/icons/location.svg';
import chevronDown from '@/assets/icons/chevron-down.svg';
import arrowRightWhite from '@/assets/icons/arrow-right-white.svg';
import daftarMitraIcon from '@/assets/icons/daftar-mitra.svg';
import { CITIES, POPULAR_CATEGORIES } from '@/features/search/catalog';
import { PATHS, buildServicesPath } from '@/routes/paths';
import HeroIllustration from './HeroIllustration';

/** Section 2. HERO — judul, pencarian, kategori populer, dan CTA. */
export default function HeroSection() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    navigate(
      buildServicesPath({
        q: String(form.get('q') ?? '').trim(),
        lokasi: form.get('lokasi'),
      }),
    );
  };

  return (
    <section className="hero" aria-labelledby="hero-title">
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

          <form
            className="hero-search"
            role="search"
            aria-label="Cari layanan"
            onSubmit={handleSubmit}
          >
            <div className="hero-search__field">
              <img src={searchIcon} alt="" width="24" height="24" />
              <label htmlFor="hero-q" className="visually-hidden">
                Kata kunci pencarian
              </label>
              <input
                id="hero-q"
                name="q"
                type="search"
                className="hero-search__input"
                placeholder="Cari layanan, kategori, lokasi, atau nama penyedia"
                autoComplete="off"
              />
            </div>
            <div className="hero-search__row">
              <div className="hero-search__location">
                <img src={locationIcon} alt="" width="22" height="22" />
                <label htmlFor="hero-lokasi" className="hero-search__location-label">
                  Lokasi
                </label>
                <select
                  id="hero-lokasi"
                  name="lokasi"
                  className="hero-search__select"
                  defaultValue=""
                >
                  <option value="">Semua kota/kabupaten</option>
                  {CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <img
                  src={chevronDown}
                  alt=""
                  width="20"
                  height="20"
                  className="hero-search__chevron"
                />
              </div>
              <button type="submit" className="btn btn--primary btn--lg hero-search__submit">
                <img src={searchWhiteIcon} alt="" width="20" height="20" />
                Cari Layanan
              </button>
            </div>
          </form>

          <h2 id="popular-categories" className="hero__subheading">
            Kategori populer
          </h2>
          <ul className="category-chips" aria-labelledby="popular-categories">
            {POPULAR_CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link to={buildServicesPath({ kategori: category.slug })} className="category-chip">
                  <img src={category.icon} alt="" width="20" height="20" />
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hero__ctas">
            <Link to={PATHS.services} className="btn btn--primary btn--lg hero__cta-primary">
              Cari Layanan
              <img src={arrowRightWhite} alt="" width="20" height="20" />
            </Link>
            <Link to={`${PATHS.register}?peran=mitra`} className="btn btn--outline btn--lg">
              <img src={daftarMitraIcon} alt="" width="20" height="20" />
              Daftar Mitra
            </Link>
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}
