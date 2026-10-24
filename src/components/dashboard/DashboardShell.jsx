import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import logo from '@/assets/icons/logo.svg';
import { useRouteFocus } from '@/hooks/useRouteFocus';
import { logout } from '@/features/auth/authApi';
import { PATHS } from '@/routes/paths';
import { BellIcon, ChevronDownIcon, LogOutIcon } from '@/components/ui/icons';
import './dashboard.css';

/** Menu akun di topbar (pola disclosure: tombol + daftar tautan). */
function UserMenu({ user, items }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="dash-user" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="dash-user__button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="dash-avatar" style={{ backgroundColor: user.color }} aria-hidden="true">
          {user.initials}
        </span>
        <span className="dash-user__text">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
        </span>
        <ChevronDownIcon />
      </button>
      <ul id={menuId} className="dash-user__menu" hidden={!open}>
        {items.map((item) => (
          <li key={item.label}>
            {item.to ? (
              <Link to={item.to} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ) : (
              <button type="button" onClick={item.onClick}>
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Kerangka dashboard (Provider & Pengelola): topbar, sidebar, dan konten utama.
 * Item sidebar: `href` = lompat ke bagian di halaman, `to` = halaman lain,
 * tanpa keduanya = fitur belum tersedia (ditandai "Segera").
 */
export default function DashboardShell({
  subtitle,
  navLabel,
  navItems,
  user,
  userMenuItems = [],
  notifications,
  sidebarNote,
  footer,
  children,
}) {
  const mainRef = useRef(null);
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  useRouteFocus(mainRef);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // Sesi tetap dianggap berakhir di sisi klien walau server tidak merespons.
    }
    navigate(PATHS.login, { replace: true });
  };

  return (
    <div className="dash">
      <header className="dash-topbar">
        <Link to={PATHS.home} className="dash-brand" aria-label="Difabel Jabar Connect, ke beranda">
          <img src={logo} alt="" width="40" height="40" />
          <span aria-hidden="true">
            <strong>Difabel Jabar Connect</strong>
            <span>{subtitle}</span>
          </span>
        </Link>
        <div className="dash-topbar__actions">
          <a
            href={notifications.href}
            className="dash-icon-button"
            aria-label={`Notifikasi, ${notifications.count} belum dibaca`}
          >
            <BellIcon size={22} />
            {notifications.count > 0 && (
              <span className="dash-icon-button__badge" aria-hidden="true">
                {notifications.count}
              </span>
            )}
          </a>
          <span className="dash-topbar__divider" aria-hidden="true" />
          <UserMenu
            user={user}
            items={[...userMenuItems, { label: 'Keluar', onClick: handleLogout }]}
          />
        </div>
      </header>

      <div className="dash-body">
        <nav className="dash-side" aria-label={navLabel}>
          <ul className="dash-side__list">
            {navItems.map(
              ({ label, icon: Icon, href, to, current, badge, badgeTone, badgeLabel }) => {
                const content = (
                  <>
                    <Icon size={22} />
                    <span className="dash-side__label">{label}</span>
                    {badge > 0 && (
                      <span
                        className={`dash-count dash-count--${badgeTone ?? 'danger'}`}
                        aria-hidden="true"
                      >
                        {badge}
                      </span>
                    )}
                  </>
                );
                const ariaLabel = badge > 0 ? `${label}, ${badge} ${badgeLabel}` : undefined;
                return (
                  <li key={label}>
                    {to ? (
                      <Link to={to} className="dash-side__item" aria-label={ariaLabel}>
                        {content}
                      </Link>
                    ) : href ? (
                      <a
                        href={href}
                        className="dash-side__item"
                        aria-current={current ? 'page' : undefined}
                        aria-label={ariaLabel}
                      >
                        {content}
                      </a>
                    ) : (
                      <span className="dash-side__item dash-side__item--soon" aria-disabled="true">
                        {content}
                        <span className="dash-soon">Segera</span>
                      </span>
                    )}
                  </li>
                );
              },
            )}
          </ul>

          <div className="dash-side__bottom">
            <div className="dash-side__note">
              <p>{sidebarNote.text}</p>
              {sidebarNote.art}
            </div>
            <button
              type="button"
              className="dash-logout"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <LogOutIcon size={22} />
              {loggingOut ? 'Keluar…' : 'Keluar'}
            </button>
          </div>
        </nav>

        <main id="main-content" ref={mainRef} tabIndex={-1} className="dash-main">
          {children}
        </main>
      </div>

      {footer}
    </div>
  );
}
