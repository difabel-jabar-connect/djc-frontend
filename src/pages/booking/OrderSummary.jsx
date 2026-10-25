import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';
import { formatRating, formatRupiah } from '@/lib/format';
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  InfoIcon,
  LockIcon,
  MapPinIcon,
  PencilIcon,
  StarFilledIcon,
} from '@/components/ui/icons';
import { ADMIN_FEE, formatLongDate, formatSlotRange } from '@/features/booking/schedule';

/** Ringkasan pesanan (sidebar, sticky). Tombol submit terhubung ke form lewat atribut `form`. */
export default function OrderSummary({
  formId,
  provider,
  pkg,
  date,
  slots,
  address,
  note,
  serviceFee,
}) {
  const [showFeeInfo, setShowFeeInfo] = useState(false);
  const hours = slots.length;
  const total = serviceFee + ADMIN_FEE;

  const rows = [
    { label: 'Tanggal', value: date ? formatLongDate(date) : null, icon: CalendarIcon },
    { label: 'Waktu', value: hours ? formatSlotRange(slots) : null, icon: ClockIcon },
    { label: 'Alamat', value: address.trim() || null, icon: MapPinIcon },
    {
      label: 'Catatan',
      value: note.trim() || null,
      icon: FileTextIcon,
      empty: 'Belum ada catatan',
    },
  ];

  return (
    <section className="order-summary" aria-labelledby="ringkasan-title">
      <div className="order-summary__head">
        <h2 id="ringkasan-title" className="side-card__title">
          Ringkasan Pesanan
        </h2>
        <a href={`#${formId}`} className="link-arrow link-arrow--offset">
          <PencilIcon size={18} />
          Ubah Pesanan
        </a>
      </div>

      <div className="order-summary__provider">
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

      {pkg && (
        <div className="order-summary__package">
          <span className="icon-tile icon-tile--soft" aria-hidden="true">
            <img src={provider.categoryIcon} alt="" width="20" height="20" />
          </span>
          <span>
            <strong>{pkg.title}</strong>
            <span className="order-summary__muted">
              {formatRupiah(pkg.priceFrom)}
              {pkg.priceUnit ? `/${pkg.priceUnit}` : ''}
            </span>
          </span>
        </div>
      )}

      <dl className="order-summary__details">
        {rows.map(({ label, value, icon: Icon, empty = 'Belum dipilih' }) => (
          <div key={label}>
            <Icon size={20} className="order-summary__icon" />
            <div>
              <dt>{label}</dt>
              <dd className={value ? undefined : 'order-summary__placeholder'}>
                {value ?? (label === 'Alamat' ? 'Belum diisi' : empty)}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="order-summary__fees">
        <div>
          <span>Biaya Layanan{pkg?.priceUnit === 'jam' && hours ? ` (${hours} jam)` : ''}</span>
          <span>{formatRupiah(serviceFee)}</span>
        </div>
        <div>
          <span className="order-summary__fee-label">
            Biaya Admin
            <button
              type="button"
              className="order-summary__info"
              aria-label="Info biaya admin"
              aria-expanded={showFeeInfo}
              aria-controls="admin-fee-info"
              onClick={() => setShowFeeInfo((open) => !open)}
            >
              <InfoIcon size={18} />
            </button>
          </span>
          <span>{formatRupiah(ADMIN_FEE)}</span>
        </div>
        <p id="admin-fee-info" className="order-summary__fee-info" hidden={!showFeeInfo}>
          Biaya pemeliharaan platform dan perlindungan transaksi.
        </p>
      </div>

      <div className="order-summary__total">
        <span>Total Harga</span>
        <strong>{formatRupiah(total)}</strong>
      </div>

      <button type="submit" form={formId} className="btn btn--primary btn--lg btn--block">
        <LockIcon />
        Konfirmasi Pesanan
        <ArrowRightIcon />
      </button>
      <p className="order-summary__terms">
        Dengan melanjutkan, Anda menyetujui{' '}
        <Link to={`${PATHS.about}#syarat`}>Syarat &amp; Ketentuan</Link> dan{' '}
        <Link to={`${PATHS.about}#privasi`}>Kebijakan Privasi</Link> Difabel Jabar Connect.
      </p>
    </section>
  );
}
