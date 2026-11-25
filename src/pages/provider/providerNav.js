import {
  BriefcaseIcon,
  CalendarIcon,
  ChatIcon,
  DashboardIcon,
  InboxIcon,
  SettingsIcon,
  StarOutlineIcon,
  UserIcon,
} from '@/components/ui/icons';
import { PATHS } from '@/routes/paths';

/**
 * Menu sidebar penyedia. Seluruh item tetap berada di dalam area DashboardShell
 * (tidak melempar penyedia keluar ke halaman publik pelanggan).
 */
export function providerNavItems({ page, activeHash = '', newCount = 0, chatUnread = 0 }) {
  const onDashboard = page === 'dashboard';
  const normalizedHash = activeHash || '#ringkasan';
  const section = (hash) =>
    onDashboard
      ? { href: hash, current: normalizedHash === hash }
      : { to: `${PATHS.providerDashboard}${hash}`, end: true };
  return [
    {
      label: 'Dashboard',
      icon: DashboardIcon,
      ...(onDashboard
        ? { href: '#ringkasan', current: normalizedHash === '#ringkasan' }
        : { to: PATHS.providerDashboard, end: true }),
    },
    { label: 'Profil Saya', icon: UserIcon, ...section('#profil') },
    { label: 'Layanan Saya', icon: BriefcaseIcon, ...section('#layanan') },
    {
      label: 'Pesanan Masuk',
      icon: InboxIcon,
      ...section('#pesanan'),
      badge: newCount,
      badgeLabel: 'baru',
    },
    {
      label: 'Chat',
      icon: ChatIcon,
      to: PATHS.providerChat,
      badge: chatUnread,
      badgeLabel: 'belum dibaca',
    },
    { label: 'Jadwal', icon: CalendarIcon, ...section('#jadwal') },
    { label: 'Ulasan', icon: StarOutlineIcon, ...section('#ulasan') },
    { label: 'Pengaturan', icon: SettingsIcon, ...section('#pengaturan') },
  ];
}
