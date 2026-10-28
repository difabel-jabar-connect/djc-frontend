import { useMemo } from 'react';
import { Outlet } from 'react-router';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  BagIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  DashboardIcon,
  GraduationIcon,
  MapFoldIcon,
  ReportIcon,
  SettingsIcon,
  ShieldCheckIcon,
  XIcon,
} from '@/components/ui/icons';
import { AdminProvider } from '@/context/AdminContext';
import { useAdmin } from '@/context/useAdmin';
import { useAuth } from '@/context/useAuth';
import { ADMIN_ME } from '@/features/admin/adminData';
import { initialsOf } from '@/features/admin/adminFormat';
import { PATHS } from '@/routes/paths';
import '../admin/admin.css';
import './pengelola.css';

/** Ilustrasi bukit & gedung di kartu sidebar (desain Pengelola). */
function HillsArt() {
  return (
    <svg width="196" height="76" viewBox="0 0 196 76" aria-hidden="true" focusable="false">
      <circle cx="40" cy="24" r="12" fill="#fff" />
      <path d="M0 76 C30 48 60 56 90 40 C120 24 160 34 196 18 V76 Z" fill="#c9e3f2" />
      <path
        d="M0 76 C40 60 80 66 120 52 C150 42 176 46 196 40 V76 Z"
        fill="#14a3a3"
        opacity="0.35"
      />
      <g
        fill="none"
        stroke="#0b3c6e"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M112 76 V48 L126 40 L140 48 V76" />
        <path d="M122 76 V64 H130 V76" />
        <path d="M146 76 V36 H160 V76" />
        <path d="M150 44 H156 M150 52 H156 M150 60 H156" />
        <path d="M166 76 V54 H184 V76" />
      </g>
      <path d="M0 75 H196" stroke="#0b3c6e" strokeWidth="2" />
      <path
        d="M78 14 L79.5 18.5 L84 20 L79.5 21.5 L78 26 L76.5 21.5 L72 20 L76.5 18.5 Z"
        fill="#14a3a3"
      />
    </svg>
  );
}

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

function PengelolaShell() {
  const { verifications, actor } = useAdmin();
  const pending = verifications.filter((v) => v.status === 'menunggu').length;
  const resubmitted = verifications.filter(
    (v) => v.status === 'perbaikan' && v.revision?.resubmitted,
  ).length;

  const navItems = [
    { label: 'Ringkasan', icon: DashboardIcon, to: PATHS.pengelola, end: true },
    { label: 'Data Alumni', icon: GraduationIcon, to: PATHS.pengelolaAlumni },
    { label: 'Data Layanan', icon: BriefcaseIcon, to: PATHS.pengelolaServices },
    { label: 'Pesanan', icon: BagIcon, to: PATHS.pengelolaOrders },
    { label: 'Wilayah', icon: MapFoldIcon, to: PATHS.pengelolaRegions },
    {
      label: 'Verifikasi',
      icon: ShieldCheckIcon,
      to: PATHS.pengelolaVerification,
      badge: pending,
      badgeTone: 'warning',
      badgeLabel: 'menunggu',
    },
    { label: 'Laporan', icon: ReportIcon, to: PATHS.pengelolaReports },
    { label: 'Pengaturan', icon: SettingsIcon, to: PATHS.pengelolaSettings },
  ];

  return (
    <DashboardShell
      subtitle="Panel Pengelola UPTD PPSGHD"
      navLabel="Menu pengelola"
      navItems={navItems}
      user={{
        name: actor.name,
        initials: actor.initials,
        color: actor.color,
        role: actor.roleLabel,
      }}
      userMenuItems={[
        { label: 'Profil Saya', to: PATHS.pengelolaSettings },
        { label: 'Keamanan', to: PATHS.pengelolaSettingsSecurity },
      ]}
      notifications={{ count: pending + resubmitted, to: PATHS.pengelolaVerification }}
      sidebarNote={{
        text: 'Kesempatan yang Setara, Manfaat untuk Semua',
        art: <HillsArt />,
      }}
    >
      <Outlet />
      <Toast />
    </DashboardShell>
  );
}

/**
 * Kerangka Panel Pengelola UPTD PPSGHD: memakai data & Audit Log yang sama dengan
 * area Admin (AdminProvider), dengan sidebar sesuai desain Pengelola.
 */
export default function PengelolaLayout() {
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
      <PengelolaShell />
    </AdminProvider>
  );
}
