import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';
import { SearchIcon } from '@/components/ui/icons';

/** Section 2. HEADER HALAMAN — breadcrumb, judul, dan ornamen dekoratif. */
export default function SearchPageHeader() {
  return (
    <section className="search-hero" aria-labelledby="page-title">
      <div className="search-hero__art" aria-hidden="true">
        <span className="search-hero__blob" />
        <span className="search-hero__ring" />
        <span className="search-hero__tile" />
        <SearchIcon size={150} strokeWidth={1.4} className="search-hero__glass" />
        <svg className="search-hero__dots" width="120" height="72" viewBox="0 0 120 72">
          {[6, 30, 54].map((cy) =>
            [6, 30, 54, 78, 102].map((cx) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="currentColor" />
            )),
          )}
        </svg>
        <svg className="search-hero__sparkle" width="26" height="26" viewBox="0 0 24 24">
          <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill="currentColor" />
        </svg>
      </div>

      <div className="container search-hero__content">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb">
            <li>
              <Link to={PATHS.home}>Beranda</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">Cari Layanan</li>
          </ol>
        </nav>
        <h1 id="page-title" className="search-hero__title">
          Cari Layanan
        </h1>
        <p className="search-hero__lead">
          Temukan layanan terpercaya dari alumni difabel di Jawa Barat.
        </p>
      </div>
    </section>
  );
}
