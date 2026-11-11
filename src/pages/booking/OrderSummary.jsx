import { formatRating, formatRupiah } from '@/lib/format';
import {
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  NoteIcon,
  StarFilledIcon,
} from '@/components/ui/icons';
import { formatLongDate } from '@/features/booking/schedule';
import { isHourly, priceLabel, timeLabel } from '@/features/booking/bookingDraft';

/** Rincian biaya (sidebar & langkah 4). Pembayaran langsung ke penyedia, tanpa biaya admin. */
export function CostBreakdown({ pkg, hours, total, children }) {
  const hourly = isHourly(pkg);
  return (
    <>
      <div className="cost-rows">
        <div>
          <span>Harga satuan</span>
          <span>{priceLabel(pkg)}</span>
        </div>
        {hourly && (
          <div>
            <span>Durasi</span>
            <span>{hours} jam</span>
          </div>
        )}
      </div>
      <div className="cost-total">
        <div>
          <span>Estimasi Total</span>
          <strong>{formatRupiah(total)}</strong>
        </div>
        {children}
      </div>
    </>
  );
}

/** Ringkasan pesanan (sidebar langkah 1–3). Baris yang belum diisi diberi gaya putus-putus. */
export default function OrderSummary({
  provider,
  pkg,
  date,
  start,
  hours,
  address,
  note,
  total,
  detailsReached,
}) {
  const hourly = isHourly(pkg);
  // Baris yang belum diisi menyebut langkah tempat mengisinya, supaya jelas ini ringkasan
  // yang terisi sendiri, bukan isian yang terlewat.
  const rows = [
    {
      label: 'Tanggal',
      icon: CalendarIcon,
      value: date ? formatLongDate(date) : null,
      hint: 'Dipilih di langkah 2 (Jadwal)',
    },
    {
      label: 'Waktu',
      icon: ClockIcon,
      value: timeLabel(start, hours, hourly) || null,
      hint: 'Dipilih di langkah 2 (Jadwal)',
    },
    {
      label: 'Alamat',
      icon: MapPinIcon,
      value: address ? (
        <>
          <span className="order-summary__address-label">
            {address.label}
            {address.primary && <span className="address-badge">Utama</span>}
          </span>
          <br />
          {address.text}
        </>
      ) : null,
      hint: 'Diisi di langkah 3 (Detail Pesanan)',
    },
    {
      label: 'Catatan',
      icon: NoteIcon,
      value:
        note.trim() || (detailsReached ? <span className="muted">Tidak ada catatan</span> : null),
      hint: 'Opsional, diisi di langkah 3',
    },
  ];

  return (
    <section className="order-summary" aria-labelledby="ringkasan-title">
      <div className="order-summary__head">
        <h2 id="ringkasan-title" className="side-card__title">
          Ringkasan Pesanan
        </h2>
        <p className="order-summary__lead">Terisi otomatis sesuai pilihan Anda di tiap langkah.</p>
      </div>

      <div className="order-summary__group">
        <p className="order-summary__caption" id="ringkasan-penyedia">
          Penyedia layanan
        </p>
        <div className="order-summary__provider" aria-labelledby="ringkasan-penyedia">
          <span
            className="order-summary__avatar"
            style={{ backgroundColor: provider.avatarColor }}
            aria-hidden="true"
          >
            {provider.initials}
          </span>
          <span>
            <strong>{provider.name}</strong>
            <span className="order-summary__muted">
              <StarFilledIcon size={14} className="text-star" />
              <span className="visually-hidden">Rating</span>
              <strong>{formatRating(provider.rating)}</strong> · {provider.city}
            </span>
          </span>
        </div>
      </div>

      {pkg && (
        <div className="order-summary__group">
          <p className="order-summary__caption">Layanan dipilih</p>
          <div className="order-summary__package">
            <BriefcaseIcon className="order-summary__package-icon" />
            <span>
              <strong>{pkg.title}</strong>
              <span className="order-summary__muted">{priceLabel(pkg)}</span>
            </span>
          </div>
        </div>
      )}

      <dl className="order-summary__details">
        {rows.map(({ label, icon: Icon, value, hint }) => (
          <div key={label} className={value ? undefined : 'order-summary__row--empty'}>
            <Icon size={20} className="order-summary__icon" />
            <div>
              <dt>{label}</dt>
              <dd>{value ?? <span className="order-summary__hint">{hint}</span>}</dd>
            </div>
          </div>
        ))}
      </dl>

      {pkg && (
        <CostBreakdown pkg={pkg} hours={hours} total={total}>
          <span className="cost-total__note">Harga final disepakati dengan penyedia.</span>
        </CostBreakdown>
      )}
    </section>
  );
}
