import { useId } from 'react';
import Drawer from '@/components/ui/Drawer';
import { ClipboardListIcon, HistoryIcon, WalletIcon, XIcon } from '@/components/ui/icons';
import { orderHistory } from '@/features/admin/adminData';
import { formatDateTime, formatScheduleLong } from '@/features/admin/adminFormat';
import { BOOKING_STATUS } from '@/features/booking/customerBookings';
import { formatRupiah } from '@/lib/format';
import { Badge, DetailList, DrawerSection, ReadOnlyBadge } from './AdminParts';

/** Drawer detail pesanan (desain Monitoring · Drawer Detail), hanya baca. */
export default function OrderDrawer({ order, categoryName, onClose }) {
  const id = useId();
  const status = order ? BOOKING_STATUS[order.status] : null;
  const history = order ? orderHistory(order) : [];

  return (
    <Drawer open={Boolean(order)} onClose={onClose} labelledBy={`${id}-title`}>
      {order && (
        <>
          <div className="drawer__head">
            <div className="ad-drawer-id">
              <div className="ad-drawer-id__meta">
                <h2 id={`${id}-title`} className="drawer__title ad-code ad-code--lg">
                  {order.code}
                </h2>
                <Badge tone={status.tone} large>
                  {status.label}
                </Badge>
              </div>
              <div className="ad-drawer-id__meta">
                <span>Dibuat {formatDateTime(order.createdAt)}</span>
                <ReadOnlyBadge small />
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
            <DrawerSection id={`${id}-info`} title="Info Pesanan" icon={ClipboardListIcon}>
              <DetailList
                rows={[
                  ['Pengguna', order.customer],
                  ['Penyedia', order.provider],
                  ['Layanan', order.service],
                  ['Kategori', categoryName ?? '–'],
                  ['Jadwal', formatScheduleLong(order.start, order.hours)],
                  ['Mode', order.mode],
                  ['Alamat', order.address],
                ]}
              />
            </DrawerSection>

            <DrawerSection id={`${id}-biaya`} title="Estimasi Biaya" icon={WalletIcon}>
              <div className="ad-cost">
                <span>
                  {formatRupiah(order.unitPrice)} × {order.qty} {order.unit}
                </span>
                <strong>{formatRupiah(order.unitPrice * order.qty)}</strong>
              </div>
              <p className="ad-hint">Pembayaran langsung ke penyedia, di luar platform.</p>
            </DrawerSection>

            <DrawerSection id={`${id}-riwayat`} title="Riwayat Status" icon={HistoryIcon}>
              <ol className="ad-timeline">
                {history.map((event, index) => (
                  <li key={`${event.label}-${event.at}`} className={`tone-${event.tone}`}>
                    <span className="ad-timeline__dot" aria-hidden="true" />
                    <div className="ad-timeline__body">
                      <span className="ad-timeline__title">
                        <strong>{event.label}</strong>
                        <span className="ad-actor-chip">
                          <span className="visually-hidden">Oleh </span>
                          {event.by}
                        </span>
                        {index === 0 && <span className="ad-latest">· Terbaru</span>}
                      </span>
                      <time dateTime={event.at}>{formatDateTime(event.at)}</time>
                    </div>
                  </li>
                ))}
              </ol>
            </DrawerSection>
          </div>
        </>
      )}
    </Drawer>
  );
}
