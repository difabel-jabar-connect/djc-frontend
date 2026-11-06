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

/** Tahap pesanan untuk penanda bar (0 = batal/ditolak, tak ada bar terisi). */
const STATUS_STEP = {
  menunggu: 1,
  diterima: 2,
  berjalan: 3,
  selesai: 4,
  dibatalkan: 0,
  ditolak: 0,
};

/**
 * Badge status pesanan: satu gaya netral untuk semua status (warna konsisten) + teks +
 * 4 bar kecil yang terisi sesuai tahap. Status dibaca dari teksnya, bukan dari warna.
 */
export function StatusBadge({ status, large = false }) {
  const meta = BOOKING_STATUS[status];
  const step = STATUS_STEP[status] ?? 0;
  return (
    <span
      className={`status-badge${step === 0 ? ' status-badge--off' : ''}${large ? ' status-badge--lg' : ''}`}
    >
      <span className="visually-hidden">Status: </span>
      <span className="status-badge__steps" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <i key={n} className={n <= step ? 'is-on' : undefined} />
        ))}
      </span>
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
