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
import { PROVIDER_ID } from '@/features/dashboard/providerDashboardData';
import { PATHS, buildProviderPath } from '@/routes/paths';

/**
 * Menu sidebar penyedia. Di halaman Dashboard tautan bagian memakai anchor (#pesanan);
 * dari halaman lain (Chat) mengarah ke rute Dashboard.
 */
export function providerNavItems({ page, newCount = 0, chatUnread = 0 }) {
  const onDashboard = page === 'dashboard';
  const section = (hash) =>
    onDashboard ? { href: hash } : { to: `${PATHS.providerDashboard}${hash}`, end: true };
  return [
    {
      label: 'Dashboard',
      icon: DashboardIcon,
      ...(onDashboard
        ? { href: '#ringkasan', current: true }
        : { to: PATHS.providerDashboard, end: true }),
    },
    { label: 'Profil Saya', icon: UserIcon, to: buildProviderPath(PROVIDER_ID) },
    { label: 'Layanan Saya', icon: BriefcaseIcon },
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
    { label: 'Ulasan', icon: StarOutlineIcon, to: `${buildProviderPath(PROVIDER_ID)}#ulasan` },
    { label: 'Pengaturan', icon: SettingsIcon },
  ];
}
