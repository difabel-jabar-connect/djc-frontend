import { NavLink, Outlet } from 'react-router';
import { BellIcon, GlobeIcon, LockIcon, SlidersIcon, UserIcon } from '@/components/ui/icons';
import { PATHS } from '@/routes/paths';
import { PageHeader } from '../AdminParts';
import './settings.css';

const ITEMS = [
  { label: 'Profil Saya', icon: UserIcon, to: PATHS.adminSettings, end: true },
  { label: 'Keamanan', icon: LockIcon, to: PATHS.adminSettingsSecurity },
  { label: 'Notifikasi', icon: BellIcon, to: PATHS.adminSettingsNotifications },
  { label: 'Informasi Platform', icon: GlobeIcon, to: PATHS.adminSettingsPlatform },
  { label: 'Aturan Sistem', icon: SlidersIcon, to: PATHS.adminSettingsRules },
];

/** Kerangka Pengaturan Admin: judul + sub-menu kiri + isi sub-halaman. */
export default function SettingsLayout() {
  return (
    <>
      <PageHeader title="Pengaturan" lead="Kelola akun Anda, notifikasi, dan informasi platform." />
      <div className="st-layout">
        <nav aria-label="Sub-menu pengaturan" className="dash-card st-nav">
          <ul>
            {ITEMS.map(({ label, icon: Icon, to, end }) => (
              <li key={to}>
                <NavLink to={to} end={end} className="st-nav__item">
                  <Icon size={20} />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="st-content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
