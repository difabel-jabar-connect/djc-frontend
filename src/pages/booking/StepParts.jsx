import { forwardRef } from 'react';
import { BOOKING_STEPS, RESPONSE_HOURS } from '@/features/booking/bookingDraft';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ClipboardCheckIcon,
  ClockIcon,
  ShieldIcon,
} from '@/components/ui/icons';

/** Judul langkah ("Langkah 2 dari 4"); difokuskan setiap pindah langkah. */
export function StepHeading({ step, title, description }) {
  return (
    <div className="step-heading">
      <p className="step-heading__eyebrow" aria-hidden="true">
        Langkah {step} dari {BOOKING_STEPS.length}
      </p>
      <h2 id="step-title" tabIndex={-1} className="step-heading__title">
        <span className="visually-hidden">
          Langkah {step} dari {BOOKING_STEPS.length},{' '}
        </span>
        {title}
      </h2>
      {description && <p className="step-heading__desc">{description}</p>}
    </div>
  );
}

/** Ringkasan error di atas langkah: tautan ke tiap isian yang perlu diperbaiki. */
export const ErrorSummary = forwardRef(function ErrorSummary({ errors }, ref) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return (
    <div
      ref={ref}
      className="error-summary"
      role="alert"
      tabIndex={-1}
      aria-labelledby="error-summary-title"
    >
      <h3 id="error-summary-title">Periksa kembali {entries.length} isian berikut</h3>
      <ul>
        {entries.map(([field, message]) => (
          <li key={field}>
            <a href={`#${field}`}>{message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
});

/** Tombol Kembali + Lanjut di bawah setiap langkah (`back` = elemen kembali kustom). */
export function StepNav({ back, onBack, backLabel = 'Kembali', next }) {
  return (
    <div className="step-nav">
      {back ??
        (onBack ? (
          <button type="button" className="btn btn--outline step-nav__back" onClick={onBack}>
            <ArrowLeftIcon />
            {backLabel}
          </button>
        ) : (
          <span />
        ))}
      {next ?? (
        <button type="submit" className="btn btn--primary step-nav__next">
          Lanjut
          <ArrowRightIcon />
        </button>
      )}
    </div>
  );
}

/** Info di bawah ringkasan (langkah 1–3). */
export function BookingAssurance() {
  return (
    <>
      <div className="booking-note">
        <span className="icon-tile icon-tile--primary" aria-hidden="true">
          <ClipboardCheckIcon size={22} />
        </span>
        <span>
          <strong>Form sederhana dan mudah diisi</strong>
          <span className="booking-note__text">Bisa diisi dengan keyboard atau pembaca layar.</span>
        </span>
      </div>
      <div className="booking-perks">
        <div>
          <span className="icon-tile" aria-hidden="true">
            <ShieldIcon size={20} />
          </span>
          <strong>Data aman</strong>
          <span>Data Anda terenkripsi.</span>
        </div>
        <div>
          <span className="icon-tile" aria-hidden="true">
            <ClockIcon size={20} />
          </span>
          <strong>Respons maks. {RESPONSE_HOURS} jam</strong>
          <span>Anda akan mendapat notifikasi saat penyedia merespons.</span>
        </div>
      </div>
    </>
  );
}
