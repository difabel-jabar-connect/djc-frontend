import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import Dialog from '@/components/ui/Dialog';
import { RESPONSE_HOURS } from '@/features/booking/bookingDraft';
import { formatBookingRange } from '@/features/booking/customerBookings';
import { PATHS, buildBookingDetailPath } from '@/routes/paths';
import { CheckIcon, ReceiptIcon, XIcon } from '@/components/ui/icons';
import { StatusBadge } from '@/pages/customer/BookingParts';

function SuccessContent({ booking, provider, onClose }) {
  const titleRef = useRef(null);

  // Setelah dialog terbuka (showModal memfokuskan tombol pertama), pindahkan fokus ke judul
  // agar pembaca layar langsung membacakan "Pesanan Berhasil Dikirim!".
  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="booking-success">
      <button
        type="button"
        className="dialog__close booking-success__close"
        aria-label="Tutup"
        onClick={onClose}
      >
        <XIcon size={22} strokeWidth={2} />
      </button>
      <span className="booking-success__badge" aria-hidden="true">
        <CheckIcon size={40} strokeWidth={3} />
      </span>
      <div className="booking-success__text">
        <h2 id="booking-success-title" ref={titleRef} tabIndex={-1}>
          Pesanan Berhasil Dikirim!
        </h2>
        <p id="booking-success-desc">
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
          <dt>Tanggal &amp; jam</dt>
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
    </div>
  );
}

/** Pop-up setelah pesanan terkirim (status Menunggu). Tutup → ke Pesanan Saya. */
export default function BookingSuccessDialog({ booking, provider, onClose }) {
  return (
    <Dialog
      open={Boolean(booking)}
      onClose={onClose}
      labelledBy="booking-success-title"
      describedBy="booking-success-desc"
      className="dialog--success"
    >
      {booking && <SuccessContent booking={booking} provider={provider} onClose={onClose} />}
    </Dialog>
  );
}
