import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { RESPONSE_HOURS } from '@/features/booking/bookingDraft';
import { formatBookingRange } from '@/features/booking/customerBookings';
import { PATHS, buildBookingDetailPath } from '@/routes/paths';
import { CheckIcon, ReceiptIcon } from '@/components/ui/icons';
import { StatusBadge } from '@/pages/customer/BookingParts';

/** Langkah 5 — pesanan terkirim (status Menunggu). */
export default function BookingSuccess({ booking, provider }) {
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <section className="booking-success" aria-labelledby="sukses-title">
      <span className="booking-success__badge" aria-hidden="true">
        <CheckIcon size={58} strokeWidth={3} />
      </span>
      <div className="booking-success__text">
        <h2 id="sukses-title" ref={titleRef} tabIndex={-1}>
          Pesanan Berhasil Dikirim!
        </h2>
        <p>
          Kami akan memberi tahu Anda saat penyedia merespons. Batas respons {RESPONSE_HOURS} jam.
        </p>
      </div>
      <dl className="booking-success__details">
        <div>
          <dt>Kode pesanan</dt>
          <dd>
            <span className="booking-success__code">{booking.code}</span>
            <StatusBadge status={booking.status} />
          </dd>
        </div>
        <div>
          <dt>Layanan</dt>
          <dd>{booking.service}</dd>
        </div>
        <div>
          <dt>Penyedia</dt>
          <dd>
            <span
              className="booking-avatar"
              style={{ backgroundColor: provider.avatarColor, '--avatar-size': '28px' }}
              aria-hidden="true"
            >
              {provider.initials}
            </span>
            {provider.name}
          </dd>
        </div>
        <div>
          <dt>Jadwal</dt>
          <dd>{formatBookingRange(booking)} WIB</dd>
        </div>
      </dl>
      <div className="booking-success__actions">
        <Link to={buildBookingDetailPath(booking.code)} className="btn btn--primary btn--md">
          <ReceiptIcon />
          Lihat Detail Pesanan
        </Link>
        <Link to={PATHS.home} className="btn btn--outline btn--md">
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  );
}
