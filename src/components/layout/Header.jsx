import { Link, NavLink } from 'react-router-dom';
import { appName } from '@/config/env';
import { PATHS } from '@/routes/paths';

const NAV_ITEMS = [
  { to: PATHS.services, label: 'Cari Layanan' },
  { to: PATHS.map, label: 'Peta Penyedia' },
  { to: PATHS.login, label: 'Masuk' },
  { to: PATHS.register, label: 'Daftar' },
];

export default function Header() {
  return (
    <header className="app-header">
      <div className="container app-header__inner">
        <Link to={PATHS.home} className="brand">
          {appName}
        </Link>
        <nav aria-label="Navigasi utama">
          <ul className="nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className="nav-link">
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
