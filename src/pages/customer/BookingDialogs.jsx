import { useId, useRef, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import StarRatingInput from '@/components/ui/StarRatingInput';
import {
  CANCEL_REASON_MAX,
  RATING_LABELS,
  REVIEW_MAX,
  formatBookingDate,
} from '@/features/booking/customerBookings';
import { AlertIcon, CalendarIcon, HeartIcon, XIcon } from '@/components/ui/icons';
import { ProviderAvatar } from './BookingParts';

function CloseButton({ label, onClick }) {
  return (
    <button type="button" className="dialog__close" aria-label={label} onClick={onClick}>
      <XIcon size={22} strokeWidth={2} />
    </button>
  );
}

/** Dialog "Batalkan pesanan?" — alasan wajib diisi (maks. 200 karakter). */
export function CancelBookingDialog({ open, booking, provider, onClose, onConfirm }) {
  const id = useId();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const fieldRef = useRef(null);

  const close = () => {
    setReason('');
    setError('');
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError('Tuliskan alasan pembatalan terlebih dahulu.');
      fieldRef.current?.focus();
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      labelledBy={`${id}-title`}
      describedBy={`${id}-desc`}
      className="dialog--sm"
    >
      <form className="dialog__form" noValidate onSubmit={handleSubmit}>
        <div className="dialog__head">
          <span className="dialog__icon dialog__icon--danger" aria-hidden="true">
            <AlertIcon size={26} strokeWidth={2.25} />
          </span>
          <div className="dialog__head-text">
            <h2 id={`${id}-title`} className="dialog__title">
              Batalkan pesanan?
            </h2>
            <p id={`${id}-desc`} className="dialog__desc">
              Pesanan{' '}
              <strong>
                {booking.code} · {booking.service}
              </strong>{' '}
              bersama {provider.name} akan dibatalkan dan penyedia diberi tahu. Tindakan ini tidak
              bisa diurungkan.
            </p>
          </div>
          <CloseButton label="Tutup dialog" onClick={close} />
        </div>

        <div className="form-field">
          <label htmlFor={`${id}-reason`} className="form-label">
            Alasan pembatalan{' '}
            <span className="form-required" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden">(wajib)</span>
          </label>
          <textarea
            ref={fieldRef}
            id={`${id}-reason`}
            className="form-textarea"
            required
            maxLength={CANCEL_REASON_MAX}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error && event.target.value.trim()) setError('');
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={`${error ? `${id}-error ` : ''}${id}-count`}
          />
          <div className="form-field__foot">
            {error && (
              <p id={`${id}-error`} className="form-field__error">
                {error}
              </p>
            )}
            <span id={`${id}-count`} className="form-counter">
              {reason.length}/{CANCEL_REASON_MAX} karakter
            </span>
          </div>
        </div>

        <div className="dialog__actions">
          <button type="button" className="btn btn--outline" onClick={close}>
            Kembali
          </button>
          <button type="submit" className="btn btn--danger-solid">
            Ya, Batalkan
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/** Dialog "Beri Ulasan" — bintang wajib, cerita opsional (maks. 500 karakter). */
export function ReviewDialog({ open, booking, provider, initialRating = 0, onClose, onSubmit }) {
  const id = useId();
  const [rating, setRating] = useState(initialRating);
  const [text, setText] = useState('');

  const close = () => {
    setText('');
    onClose();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!rating) return;
    onSubmit({ rating, text: text.trim() });
    setText('');
  };

  return (
    <Dialog open={open} onClose={close} labelledBy={`${id}-title`}>
      <form className="dialog__form" noValidate onSubmit={handleSubmit}>
        <div className="dialog__head">
          <h2 id={`${id}-title`} className="dialog__title">
            Beri Ulasan
          </h2>
          <CloseButton label="Tutup form ulasan" onClick={close} />
        </div>

        <div className="review-summary">
          <ProviderAvatar provider={provider} />
          <div>
            <span className="review-summary__service">{booking.service}</span>
            <span className="review-summary__provider">{provider.name}</span>
            <span className="review-summary__date">
              <CalendarIcon size={16} />
              {formatBookingDate(booking)}
            </span>
          </div>
        </div>

        <fieldset className="form-fieldset">
          <legend id={`${id}-legend`}>
            Penilaian Anda{' '}
            <span className="form-required" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden">(wajib)</span>
          </legend>
          <div className="rating-row">
            <StarRatingInput value={rating} onChange={setRating} labelledBy={`${id}-legend`} />
            <span
              className={`rating-row__value${rating ? ' rating-row__value--set' : ''}`}
              aria-live="polite"
            >
              {rating ? `${rating} · ${RATING_LABELS[rating - 1]}` : 'Pilih jumlah bintang'}
            </span>
          </div>
          <p className="form-tip">Tip: gunakan tombol panah kiri/kanan untuk mengubah nilai.</p>
        </fieldset>

        <div className="form-field">
          <label htmlFor={`${id}-text`} className="form-label">
            Ceritakan pengalaman Anda <span className="form-label__optional">(opsional)</span>
          </label>
          <textarea
            id={`${id}-text`}
            className="form-textarea"
            maxLength={REVIEW_MAX}
            placeholder="Apa yang paling Anda sukai dari layanan ini?"
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-describedby={`${id}-count`}
          />
          <span id={`${id}-count`} className="form-counter">
            {text.length}/{REVIEW_MAX}
          </span>
        </div>

        <p className="review-encourage">
          <HeartIcon size={18} />
          Ulasan Anda membantu alumni difabel berkembang.
        </p>

        <div className="dialog__actions">
          <button type="button" className="btn btn--outline" onClick={close}>
            Batal
          </button>
          <button type="submit" className="btn btn--primary" disabled={!rating}>
            Kirim Ulasan
          </button>
        </div>
      </form>
    </Dialog>
  );
}
