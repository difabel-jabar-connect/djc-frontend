import { NavLink, Outlet } from 'react-router';
import { BellIcon, GlobeIcon, LockIcon, SlidersIcon, UserIcon } from '@/components/ui/icons';
import { PageHeader } from '../AdminParts';
import './settings.css';

/** Tautan relatif terhadap rute Pengaturan, agar bisa dipakai di /admin dan /pengelola. */
const ITEMS = [
  { label: 'Profil Saya', icon: UserIcon, to: '.', end: true },
  { label: 'Keamanan', icon: LockIcon, to: 'keamanan' },
  { label: 'Notifikasi', icon: BellIcon, to: 'notifikasi' },
  { label: 'Informasi Platform', icon: GlobeIcon, to: 'informasi' },
  { label: 'Aturan Sistem', icon: SlidersIcon, to: 'aturan' },
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
