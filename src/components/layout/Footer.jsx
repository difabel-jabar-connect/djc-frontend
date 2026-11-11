import { Link } from 'react-router';
import { appName } from '@/config/env';
import logo from '@/assets/icons/logo-footer.svg';
import { CATEGORY_PHOTOS } from '@/features/content/photoCredits';
import { PATHS } from '@/routes/paths';

const FOOTER_MENU = [
  { to: PATHS.home, label: 'Beranda' },
  { to: PATHS.services, label: 'Cari Layanan' },
  { to: PATHS.about, label: 'Tentang' },
  { to: `${PATHS.about}#kontak`, label: 'Kontak' },
];

const PARTNERS = ['Alumni PPSGHD', 'UPTD PPSGHD Jawa Barat'];

export default function Footer() {
  const credits = Object.values(CATEGORY_PHOTOS);
  return (
    <footer className="app-footer">
      <div className="container">
        <Link
          to={PATHS.home}
          className="brand app-footer__brand"
          aria-label={`${appName}, ke beranda`}
        >
          <img src={logo} alt="" width="40" height="40" className="brand__logo" />
          <span className="brand__name" aria-hidden="true">
            {appName}
          </span>
        </Link>

        <div className="app-footer__grid">
          <nav className="app-footer__col" aria-labelledby="footer-menu-title">
            <h2 id="footer-menu-title" className="app-footer__heading">
              Menu
            </h2>
            <ul className="app-footer__menu">
              {FOOTER_MENU.map((item) => (
                <li key={item.label}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="app-footer__col">
            <h2 className="app-footer__heading">Bekerja sama dengan</h2>
            <ul className="app-footer__menu">
              {PARTNERS.map((partner) => (
                <li key={partner}>
                  <span>{partner}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="app-footer__contact">
            <h2 className="app-footer__heading">{appName}</h2>
            <p>Jasa sehari-hari dari alumni difabel UPTD PPSGHD, untuk seluruh Jawa Barat.</p>
            <p>Dibuat dengan prinsip desain inklusif sesuai WCAG 2.2 AA.</p>
          </div>
        </div>

        <p className="app-footer__credits">
          Foto keahlian:{' '}
          {credits.map((photo, i) => (
            <span key={photo.page}>
              <a href={photo.page} target="_blank" rel="noreferrer">
                {photo.title}
              </a>{' '}
              oleh {photo.creator}, {photo.license}
              {i < credits.length - 1 ? '; ' : '. '}
            </span>
          ))}
          Via Wikimedia Commons.
        </p>

        <div className="app-footer__bottom">
          <p>
            © {new Date().getFullYear()} {appName}. Seluruh hak cipta dilindungi.
          </p>
          <a href="#main-content" className="btn btn--on-dark">
            Kembali ke atas
          </a>
        </div>
      </div>
    </footer>
  );
}
