import { Link, NavLink, useLocation } from 'react-router';
import logo from '@/assets/icons/logo.svg';
import loginIcon from '@/assets/icons/login.svg';
import { PATHS } from '@/routes/paths';

const NAV_ITEMS = [
  { to: PATHS.home, label: 'Beranda', end: true },
  // Profil penyedia & pemesanan adalah bagian dari alur Cari Layanan.
  { to: PATHS.services, label: 'Cari Layanan', sections: ['/provider/', '/pesan/'] },
  { to: PATHS.about, label: 'Tentang' },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <Link to={PATHS.home} className="brand" aria-label="Difabel Jabar Connect, ke beranda">
          <img src={logo} alt="" width="44" height="44" className="brand__logo" />
          <span className="brand__text" aria-hidden="true">
            <span className="brand__name">Difabel Jabar</span>
            <span className="brand__tagline">Connect</span>
          </span>
        </Link>
        <nav className="app-header__nav" aria-label="Navigasi utama">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                {item.sections?.some((prefix) => pathname.startsWith(prefix)) ? (
                  <Link to={item.to} className="nav-link active" aria-current="true">
                    {item.label}
                  </Link>
                ) : (
                  <NavLink to={item.to} end={item.end} className="nav-link">
                    {item.label}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <div className="app-header__actions">
          <Link to={PATHS.login} className="btn btn--outline">
            <img src={loginIcon} alt="" width="20" height="20" />
            Masuk
          </Link>
        </div>
      </div>
    </header>
  );
}
