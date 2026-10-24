import { BOOKING_STATUS } from '@/features/booking/customerBookings';
import {
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  RotateCwIcon,
  XCircleIcon,
} from '@/components/ui/icons';

const STATUS_ICONS = {
  menunggu: ClockIcon,
  diterima: CheckIcon,
  berjalan: RotateCwIcon,
  selesai: CheckCircleIcon,
  dibatalkan: XCircleIcon,
  ditolak: XCircleIcon,
};

export function StatusIcon({ status, ...props }) {
  const Icon = STATUS_ICONS[status];
  return <Icon strokeWidth={2.25} {...props} />;
}

/** Badge status pesanan: warna + ikon + teks (status tidak hanya dibedakan lewat warna). */
export function StatusBadge({ status, large = false }) {
  const meta = BOOKING_STATUS[status];
  return (
    <span className={`status-badge tone-${meta.tone}${large ? ' status-badge--lg' : ''}`}>
      <span className="visually-hidden">Status: </span>
      <StatusIcon status={status} size={large ? 20 : 16} />
      {meta.label}
    </span>
  );
}

export function ProviderAvatar({ provider, size = 52 }) {
  return (
    <span
      className="booking-avatar"
      style={{ backgroundColor: provider.avatarColor, '--avatar-size': `${size}px` }}
      aria-hidden="true"
    >
      {provider.initials}
    </span>
  );
}
