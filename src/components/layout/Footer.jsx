import { Link } from 'react-router';
import logo from '@/assets/icons/logo-footer.svg';
import partnerAlumniIcon from '@/assets/icons/partner-alumni.svg';
import partnerUptdIcon from '@/assets/icons/partner-uptd.svg';
import { appName } from '@/config/env';
import { PATHS } from '@/routes/paths';

const FOOTER_MENU = [
  { to: PATHS.home, label: 'Beranda' },
  { to: PATHS.services, label: 'Cari Layanan' },
  { to: PATHS.about, label: 'Tentang' },
  { to: `${PATHS.about}#kontak`, label: 'Kontak' },
];

const PARTNERS = [
  { name: 'Alumni PPSGHD', icon: partnerAlumniIcon },
  { name: 'UPTD PPSGHD Jawa Barat', icon: partnerUptdIcon },
];

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <div className="app-footer__grid">
          <div className="app-footer__about">
            <Link to={PATHS.home} className="brand" aria-label={`${appName}, ke beranda`}>
              <img src={logo} alt="" width="44" height="44" className="brand__logo" />
              <span className="brand__name" aria-hidden="true">
                {appName}
              </span>
            </Link>
            <p className="app-footer__tagline">
              Talenta Difabel, untuk Jawa Barat yang Lebih Inklusif.
            </p>
          </div>

          <nav aria-labelledby="footer-menu-title">
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

          <div>
            <h2 className="app-footer__heading">Bekerja sama dengan</h2>
            <ul className="app-footer__partners">
              {PARTNERS.map((partner) => (
                <li key={partner.name} className="app-footer__partner">
                  <img src={partner.icon} alt="" width="22" height="22" />
                  {partner.name}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="app-footer__bottom">
          <p>
            © {new Date().getFullYear()} {appName}. Seluruh hak cipta dilindungi.
          </p>
          <p>Dibuat dengan prinsip desain inklusif · WCAG 2.2 AA</p>
        </div>
      </div>
    </footer>
  );
}
