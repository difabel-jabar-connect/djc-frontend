import { Link, NavLink, useLocation, useNavigate } from 'react-router';
import logo from '@/assets/icons/logo.svg';
import loginIcon from '@/assets/icons/login.svg';
import { useAuth } from '@/context/useAuth';
import { useCustomer } from '@/context/useCustomer';
import { getSampleProvider } from '@/features/providers/sampleProviders';
import { PATHS, buildBookingDetailPath } from '@/routes/paths';
import UserMenu, { Disclosure } from '@/components/ui/UserMenu';
import { BellIcon, ChevronDownIcon } from '@/components/ui/icons';

const NAV_ITEMS = [
  { to: PATHS.home, label: 'Beranda', end: true },
  // Profil penyedia & pemesanan adalah bagian dari alur Cari Layanan.
  { to: PATHS.services, label: 'Cari Layanan', sections: ['/provider/', '/pesan/'] },
  { to: PATHS.about, label: 'Tentang' },
];

/** Pelanggan yang sudah masuk mendapat menu "Pesanan Saya" (desain Beranda login). */
const CUSTOMER_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  { to: PATHS.customerBookings, label: 'Pesanan Saya' },
  NAV_ITEMS[2],
];

const ROLE_MENU = {
  customer: [{ label: 'Pesanan Saya', to: PATHS.customerBookings }],
  provider: [{ label: 'Dashboard Penyedia', to: PATHS.providerDashboard }],
  admin: [{ label: 'Dashboard Pengelola', to: PATHS.adminDashboard }],
};

const NOTIFICATION_TEXT = {
  diterima: (name) => `${name} menerima pesanan Anda`,
  berjalan: (name) => `${name} mulai mengerjakan pesanan Anda`,
};

/** Notifikasi pembaruan pesanan (sementara dari flag `unread` data contoh). */
function Notifications() {
  const { bookings } = useCustomer();
  const unread = bookings.filter((b) => b.unread && NOTIFICATION_TEXT[b.status]);

  return (
    <Disclosure
      className="notif-menu"
      buttonProps={{
        'aria-label': unread.length
          ? `Notifikasi, ${unread.length} belum dibaca`
          : 'Notifikasi, tidak ada yang baru',
      }}
      buttonContent={
        <>
          <BellIcon size={22} />
          {unread.length > 0 && (
            <span className="notif-menu__badge" aria-hidden="true">
              {unread.length}
            </span>
          )}
        </>
      }
    >
      {(close) => (
        <>
          <p className="notif-menu__title">Notifikasi</p>
          {unread.length ? (
            <ul className="notif-menu__list">
              {unread.map((b) => (
                <li key={b.code}>
                  <Link to={buildBookingDetailPath(b.code)} onClick={close}>
                    <strong>
                      {NOTIFICATION_TEXT[b.status](getSampleProvider(b.providerId).name)}
                    </strong>
                    <span>
                      {b.code} · {b.service}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="notif-menu__empty">Belum ada notifikasi baru.</p>
          )}
        </>
      )}
    </Disclosure>
  );
}

function AccountActions({ user }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate(PATHS.home, { replace: true });
  };

  return (
    <>
      {user.role === 'customer' && <Notifications />}
      <UserMenu
        className="account-menu"
        label={`Menu akun ${user.name}`}
        buttonContent={
          <>
            <span className="account-menu__avatar" aria-hidden="true">
              {user.initials}
            </span>
            <span className="account-menu__name" aria-hidden="true">
              {user.name}
            </span>
            <ChevronDownIcon />
          </>
        }
        items={[...(ROLE_MENU[user.role] ?? []), { label: 'Keluar', onClick: handleLogout }]}
      />
    </>
  );
}

export default function Header() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const navItems = user?.role === 'customer' ? CUSTOMER_NAV_ITEMS : NAV_ITEMS;

  return (
    <header className={`app-header${user ? ' app-header--signed-in' : ''}`}>
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
            {navItems.map((item) => (
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
          {user ? (
            <AccountActions user={user} />
          ) : (
            <Link to={PATHS.login} className="btn btn--outline">
              <img src={loginIcon} alt="" width="20" height="20" />
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
