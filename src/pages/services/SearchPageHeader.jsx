import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';

/** Section 2. HEADER HALAMAN — breadcrumb, judul, dan ornamen dekoratif. */
export default function SearchPageHeader() {
  return (
    <section className="search-hero" aria-labelledby="page-title">
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
