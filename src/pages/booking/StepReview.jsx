import { Link } from 'react-router';
import { formatRating } from '@/lib/format';
import { formatLongDate } from '@/features/booking/schedule';
import {
  RESPONSE_HOURS,
  isHourly,
  normalizePhone,
  priceLabel,
  timeLabel,
} from '@/features/booking/bookingDraft';
import { PATHS } from '@/routes/paths';
import {
  CalendarIcon,
  ClockIcon,
  InfoIcon,
  MapPinIcon,
  NoteIcon,
  StarFilledIcon,
  UserIcon,
} from '@/components/ui/icons';
import { CostBreakdown } from './OrderSummary';
import { StepHeading } from './StepParts';

function ReviewRow({ label, onEdit, editLabel, children }) {
  return (
    <div className="review-row">
      <dt>{label}</dt>
      <dd>{children}</dd>
      <button type="button" className="text-action" aria-label={editLabel} onClick={onEdit}>
        Ubah
      </button>
    </div>
  );
}

/** Langkah 4 — periksa kembali lalu kirim. */
export default function StepReview({
  profile,
  pkg,
  user,
  draft,
  date,
  hours,
  address,
  total,
  update,
  errors,
  goTo,
}) {
  const hourly = isHourly(pkg);
  const phone = user.phone ?? `+62 ${normalizePhone(draft.phone)}`;
  const agreeError = errors['booking-agree'];

  return (
    <>
      <StepHeading
        step={4}
        title="Periksa Kembali Pesanan Anda"
        description="Pastikan semua detail sudah benar sebelum dikirim."
      />

      <div className="review-grid">
        <section className="booking-card review-card" aria-label="Ringkasan pesanan">
          <dl>
            <ReviewRow label="Layanan" editLabel="Ubah layanan" onEdit={() => goTo(1)}>
              <div className="review-provider">
                <span
                  className="booking-avatar"
                  style={{ backgroundColor: profile.avatarColor }}
                  aria-hidden="true"
                >
                  {profile.initials}
                </span>
                <span>
                  <strong>{profile.name}</strong>
                  <span className="review-provider__rating">
                    <StarFilledIcon size={15} className="text-star" />
                    <span className="visually-hidden">Rating</span>
                    <strong>{formatRating(profile.rating)}</strong>({profile.reviewCount} ulasan)
                  </span>
                  <span>
                    {pkg.title} · {priceLabel(pkg)}
                  </span>
                </span>
              </div>
            </ReviewRow>
            <ReviewRow label="Jadwal" editLabel="Ubah jadwal" onEdit={() => goTo(2)}>
              <span className="review-value">
                <CalendarIcon />
                {formatLongDate(date)} · {timeLabel(draft.start, hours, hourly)}
              </span>
            </ReviewRow>
            <ReviewRow label="Alamat" editLabel="Ubah alamat" onEdit={() => goTo(3)}>
              <span className="review-value">
                <MapPinIcon />
                {address.label === 'Alamat lain'
                  ? address.text
                  : `${address.label} – ${address.text}`}
              </span>
            </ReviewRow>
            <ReviewRow label="Catatan" editLabel="Ubah catatan" onEdit={() => goTo(3)}>
              <span className="review-value">
                <NoteIcon />
                {draft.note.trim() || <span className="muted">Tidak ada catatan</span>}
              </span>
            </ReviewRow>
            <ReviewRow label="Data Pemesan" editLabel="Ubah data pemesan" onEdit={() => goTo(3)}>
              <span className="review-value">
                <UserIcon />
                {user.name} · {phone}
              </span>
            </ReviewRow>
          </dl>
        </section>

        <div className="review-side">
          <section className="booking-card" aria-labelledby="rincian-title">
            <h3 id="rincian-title" className="booking-card__title">
              Rincian Biaya
            </h3>
            <CostBreakdown pkg={pkg} hours={hours} total={total} />
            <p className="field-hint field-hint--icon">
              <InfoIcon size={18} />
              Harga final disepakati dengan penyedia. Pembayaran langsung ke penyedia.
            </p>
          </section>

          <p className="response-note">
            <ClockIcon size={18} strokeWidth={2.25} />
            Penyedia punya waktu {RESPONSE_HOURS} jam untuk merespons. Jika tidak, pesanan batal
            otomatis.
          </p>

          <div>
            <label
              htmlFor="booking-agree"
              className={`agree-box${agreeError ? ' agree-box--invalid' : ''}`}
            >
              <input
                id="booking-agree"
                type="checkbox"
                checked={draft.agree}
                onChange={(event) => update({ agree: event.target.checked })}
                aria-invalid={Boolean(agreeError)}
                aria-describedby={agreeError ? 'booking-agree-error' : undefined}
              />
              <span>
                Saya menyetujui <Link to={`${PATHS.about}#syarat`}>Syarat &amp; Ketentuan</Link> dan{' '}
                <Link to={`${PATHS.about}#privasi`}>Kebijakan Privasi</Link> Difabel Jabar Connect.
              </span>
            </label>
            {agreeError && (
              <p id="booking-agree-error" className="field-error">
                {agreeError}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
