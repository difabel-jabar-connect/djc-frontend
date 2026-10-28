import { useMemo } from 'react';
import { Outlet } from 'react-router';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  CheckCircleIcon,
  ClipboardListIcon,
  DashboardIcon,
  HistoryIcon,
  MessageStarIcon,
  SettingsIcon,
  ShapesIcon,
  ShieldCheckIcon,
  UsersIcon,
  XIcon,
} from '@/components/ui/icons';
import { AdminProvider } from '@/context/AdminContext';
import { useAdmin } from '@/context/useAdmin';
import { useAuth } from '@/context/useAuth';
import { ADMIN_ME } from '@/features/admin/adminData';
import { initialsOf } from '@/features/admin/adminFormat';
import { PATHS } from '@/routes/paths';
import './admin.css';

/** Ilustrasi kota di kartu sidebar (desain Admin). */
function SkylineArt() {
  return (
    <svg width="196" height="76" viewBox="0 0 196 76" aria-hidden="true" focusable="false">
      <circle cx="150" cy="22" r="12" fill="#fff" />
      <g
        fill="none"
        stroke="#0b3c6e"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M2 76 V54 H18 V40 H30 V54 H40 V76" />
        <path d="M44 76 V46 L58 36 L72 46 V76" />
        <path d="M54 76 V62 H62 V76" />
        <path d="M78 76 V40 H86 V30 C86 22 106 22 106 30 V40 H114 V76" />
        <path d="M90 50 H102 M90 60 H102" />
        <path d="M120 76 V50 L136 42 L152 50 V76" />
        <path d="M158 76 V58 H170 V48 H184 V76" />
      </g>
      <path d="M0 75 H196" stroke="#14a3a3" strokeWidth="3" />
      <path
        d="M96 18 L97.5 22.5 L102 24 L97.5 25.5 L96 30 L94.5 25.5 L90 24 L94.5 22.5 Z"
        fill="#14a3a3"
      />
    </svg>
  );
}

/** Toast konfirmasi (desain: hijau, 6 detik, diumumkan lewat aria-live). */
function Toast() {
  const { toast, dismissToast } = useAdmin();
  return (
    <div className="ad-toast-region" role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className="ad-toast">
          <CheckCircleIcon size={22} strokeWidth={2.25} />
          <span>{toast.message}</span>
          <button type="button" aria-label="Tutup notifikasi" onClick={dismissToast}>
            <XIcon size={18} strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}

function AdminShell() {
  const { verifications, reviews, actor } = useAdmin();
  const pending = verifications.filter((v) => v.status === 'menunggu').length;
  const reported = reviews.filter((r) => r.status === 'dilaporkan').length;

  const navItems = [
    { label: 'Dashboard', icon: DashboardIcon, to: PATHS.adminDashboard, end: true },
    {
      label: 'Verifikasi Penyedia',
      icon: ShieldCheckIcon,
      to: PATHS.adminVerification,
      badge: pending,
      badgeTone: 'warning',
      badgeLabel: 'menunggu',
    },
    { label: 'Kelola User', icon: UsersIcon, to: PATHS.adminUsers },
    { label: 'Kategori Layanan', icon: ShapesIcon, to: PATHS.adminCategories },
    {
      label: 'Moderasi Ulasan',
      icon: MessageStarIcon,
      to: PATHS.adminReviews,
      badge: reported,
      badgeTone: 'danger',
      badgeLabel: 'dilaporkan',
    },
    { label: 'Monitoring Pesanan', icon: ClipboardListIcon, to: PATHS.adminOrders },
    { label: 'Audit Log', icon: HistoryIcon, to: PATHS.adminAudit },
    { label: 'Pengaturan', icon: SettingsIcon, to: PATHS.adminSettings },
  ];

  return (
    <DashboardShell
      subtitle="Talenta Difabel, Jabar Inklusif"
      navLabel="Menu admin"
      navItems={navItems}
      user={{
        name: actor.name,
        initials: actor.initials,
        color: actor.color,
        role: actor.roleLabel,
      }}
      userMenuItems={[
        { label: 'Profil Saya', to: PATHS.adminSettings },
        { label: 'Keamanan', to: PATHS.adminSettingsSecurity },
      ]}
      notifications={{ count: pending + reported, to: PATHS.adminDashboard }}
      sidebarNote={{
        text: 'Bersama Mewujudkan Jawa Barat yang Lebih Inklusif',
        art: <SkylineArt />,
      }}
    >
      <Outlet />
      <Toast />
    </DashboardShell>
  );
}

/**
 * Kerangka semua halaman Admin (FR-ADM-*): data admin bersama, sidebar dengan
 * jumlah antrean, dan toast. Halaman anak dirender lewat <Outlet>.
 */
export default function AdminLayout() {
  const { user } = useAuth();
  const actor = useMemo(
    () =>
      user?.role === 'admin'
        ? {
            ...ADMIN_ME,
            id: user.id ?? ADMIN_ME.id,
            name: user.name,
            initials: user.initials ?? initialsOf(user.name),
          }
        : ADMIN_ME,
    [user],
  );
  return (
    <AdminProvider actor={actor}>
      <AdminShell />
    </AdminProvider>
  );
}
