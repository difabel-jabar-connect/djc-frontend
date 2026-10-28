import { useId } from 'react';
import { Link } from 'react-router';
import Drawer from '@/components/ui/Drawer';
import {
  BriefcaseIcon,
  ChartLineIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  MessageTextIcon,
  StarFilledIcon,
  UserIcon,
  XIcon,
} from '@/components/ui/icons';
import { formatDateTime } from '@/features/admin/adminFormat';
import { BOOKING_STATUS } from '@/features/booking/customerBookings';
import { SERVICE_STATUS, serviceOrderStats } from '@/features/pengelola/pengelolaData';
import { formatScore } from '@/features/pengelola/pengelolaFormat';
import { formatRupiah } from '@/lib/format';
import { buildAlumniPath } from '@/routes/paths';
import {
  Avatar,
  Badge,
  CategoryIcon,
  DetailList,
  DrawerSection,
  ReadOnlyBadge,
} from '../admin/AdminParts';
import { AlumniStatusBadge } from './PengelolaParts';

/** Drawer detail layanan (desain Data Layanan · Drawer Detail). */
export default function ServiceDrawer({ service, category, provider, onClose, onHide, onShow }) {
  const id = useId();
  const status = service ? SERVICE_STATUS[service.status] : null;
  const stats = service ? serviceOrderStats(service) : null;

  return (
    <Drawer open={Boolean(service)} onClose={onClose} labelledBy={`${id}-title`}>
      {service && (
        <>
          <div className="drawer__head">
            <div className="drawer__head-main">
              <span className="pg-service-icon pg-service-icon--lg" aria-hidden="true">
                <CategoryIcon icon={category?.icon} size={28} />
              </span>
              <div className="ad-drawer-id">
                <h2 id={`${id}-title`} className="drawer__title">
                  {service.name}
                </h2>
                <div className="ad-drawer-id__meta">
                  <Badge
                    tone={status.tone}
                    icon={service.status === 'disembunyikan' ? EyeOffIcon : undefined}
                  >
                    {status.label}
                  </Badge>
                  <ReadOnlyBadge small />
                </div>
              </div>
            </div>
            <button
              type="button"
              className="drawer__close"
              aria-label="Tutup panel"
              onClick={onClose}
            >
              <XIcon size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="drawer__body">
            <p className="ad-info ad-info--bordered" role="note">
              <InfoIcon size={20} />
              Isi layanan dikelola oleh penyedia. Pengelola hanya dapat menyembunyikan layanan yang
              melanggar ketentuan.
            </p>
            {service.hidden && (
              <p className="pg-note-muted" role="note">
                <EyeOffIcon size={18} />
                <span>
                  Disembunyikan oleh <strong>{service.hidden.by}</strong> ·{' '}
                  {formatDateTime(service.hidden.at)} · Alasan: {service.hidden.reason}
                </span>
              </p>
            )}

            <DrawerSection id={`${id}-info`} title="Info Layanan" icon={BriefcaseIcon}>
              <DetailList
                rows={[
                  ['Kategori', category?.name ?? '–'],
                  [
                    'Harga',
                    <>
                      <strong className="pg-price">{formatRupiah(service.price)}</strong> /{' '}
                      {service.unit}
                    </>,
                  ],
                  ['Estimasi durasi', service.duration],
                  ['Mode', service.mode],
                ]}
              />
            </DrawerSection>

            <DrawerSection id={`${id}-desc`} title="Deskripsi" icon={MessageTextIcon}>
              <p className="ad-body-text">{service.description}</p>
            </DrawerSection>

            {provider && (
              <DrawerSection id={`${id}-prov`} title="Penyedia" icon={UserIcon}>
                <Link to={buildAlumniPath(provider.id)} className="pg-provider-link">
                  <Avatar person={provider} size={40} />
                  <span className="pg-provider-link__text">
                    <strong>{provider.name}</strong>
                    <span>
                      {provider.city} · <AlumniStatusBadge status={provider.status} />
                    </span>
                  </span>
                  <span className="pg-provider-link__cta">Detail Alumni →</span>
                </Link>
              </DrawerSection>
            )}

            <DrawerSection id={`${id}-stat`} title="Pesanan & Rating" icon={ChartLineIcon}>
              <ul
                className="pg-status-grid pg-status-grid--compact"
                aria-label="Pesanan per status"
              >
                {Object.entries(BOOKING_STATUS).map(([key, meta]) => (
                  <li key={key}>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <strong>{stats[key]}</strong>
                  </li>
                ))}
              </ul>
              <p className="pg-rating pg-rating--lg">
                <StarFilledIcon size={18} aria-hidden="true" />
                {service.rating == null ? (
                  <span>Belum ada ulasan</span>
                ) : (
                  <>
                    <strong>{formatScore(service.rating)}</strong>
                    <span>dari {service.reviews} ulasan</span>
                  </>
                )}
              </p>
            </DrawerSection>
          </div>

          <div className="drawer__foot">
            {service.status === 'disembunyikan' ? (
              <button type="button" className="btn btn--md pg-btn-success-outline" onClick={onShow}>
                <EyeIcon size={18} strokeWidth={2.25} />
                Tampilkan Lagi
              </button>
            ) : (
              <button type="button" className="btn btn--danger btn--md" onClick={onHide}>
                <EyeOffIcon size={18} strokeWidth={2.25} />
                Sembunyikan Layanan
              </button>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
