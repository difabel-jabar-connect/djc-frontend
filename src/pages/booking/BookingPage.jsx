import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/useAuth';
import { useCustomer } from '@/context/useCustomer';
import { getProviderProfile } from '@/features/providers/providerProfiles';
import {
  calculateServiceFee,
  parseISODate,
  startOfDay,
  toISODate,
} from '@/features/booking/schedule';
import {
  BOOKING_STEPS,
  clearDraft,
  createDraft,
  draftToBooking,
  effectiveDuration,
  firstIncompleteStep,
  loadDraft,
  saveDraft,
  selectedAddress,
  validateStep,
} from '@/features/booking/bookingDraft';
import { findBooking } from '@/features/booking/customerBookings';
import { PATHS, buildProviderPath } from '@/routes/paths';
import { ArrowLeftIcon, ArrowRightIcon, SendIcon } from '@/components/ui/icons';
import BookingStepper from './BookingStepper';
import OrderSummary from './OrderSummary';
import StepService from './StepService';
import StepSchedule from './StepSchedule';
import StepDetails from './StepDetails';
import StepReview from './StepReview';
import BookingSuccess from './BookingSuccess';
import { BookingAssurance, ErrorSummary, StepNav } from './StepParts';
import './booking.css';
import './bookingSteps.css';

const LEADS = {
  4: 'Satu langkah lagi. Periksa pesanan Anda, lalu kirim ke penyedia.',
  5: 'Pesanan Anda sudah terkirim ke penyedia.',
};
const DEFAULT_LEAD =
  'Lengkapi detail pemesanan untuk mendapatkan layanan dari penyedia terpercaya Difabel Jabar Connect.';

function initialDraft(profile, user, searchParams, today) {
  if (!profile) return null;
  const requested = parseISODate(searchParams.get('tanggal'));
  const date =
    requested && requested >= today && profile.workDays.includes(requested.getDay())
      ? requested
      : null;
  const base = createDraft({ profile, user, packageId: searchParams.get('paket'), date });
  // Muat ulang di tengah alur (?langkah=…) → lanjutkan draf yang tersimpan.
  const stored = searchParams.has('langkah') ? loadDraft(profile.id) : null;
  return stored ? { ...base, ...stored, agree: false } : base;
}

/**
 * Pesan Layanan (FR-CUST-06/07) — 4 langkah + halaman sukses (desain pesan-layanan-1…5).
 * Langkah aktif ada di URL (?langkah=2) sehingga tombol Back browser berpindah langkah;
 * langkah yang prasyaratnya belum lengkap dikembalikan ke langkah pertama yang belum lengkap.
 */
export default function BookingPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = getProviderProfile(id);
  const { user } = useAuth();
  const { bookings, createBooking } = useCustomer();
  useDocumentTitle(profile ? 'Pesan Layanan' : 'Penyedia tidak ditemukan');

  const today = startOfDay(new Date());
  const [draft, setDraft] = useState(() => initialDraft(profile, user, searchParams, today));
  const [attempted, setAttempted] = useState(null);
  const errorRef = useRef(null);
  const previousStep = useRef(null);

  const context = { draft, profile, user, today };
  const created =
    searchParams.get('langkah') === 'selesai'
      ? findBooking(bookings, searchParams.get('kode') ?? '')
      : null;
  const requested = Number(searchParams.get('langkah')) || 1;
  const step = !profile
    ? 0
    : created
      ? 5
      : Math.max(1, Math.min(requested, 4, firstIncompleteStep(context)));

  useEffect(() => {
    if (profile && step >= 1 && step <= 4) saveDraft(profile.id, draft);
  }, [profile, draft, step]);

  // Pindah langkah: kembali ke atas lalu fokus ke judul langkah (bukan saat halaman pertama dibuka).
  useEffect(() => {
    if (previousStep.current !== null && previousStep.current !== step && step <= 4) {
      window.scrollTo(0, 0);
      document.getElementById('step-title')?.focus({ preventScroll: true });
    }
    previousStep.current = step;
  }, [step]);

  if (!profile) {
    return (
      <section className="container page" aria-labelledby="page-title">
        <h1 id="page-title">Penyedia tidak ditemukan</h1>
        <p className="lead">Pemesanan tidak dapat dilanjutkan karena penyedia tidak tersedia.</p>
        <Link to={PATHS.services} className="btn btn--primary">
          Kembali ke Cari Layanan
        </Link>
      </section>
    );
  }

  const pkg = profile.packages.find((p) => p.id === draft.packageId);
  const date = parseISODate(draft.date);
  const hours = effectiveDuration(draft, pkg);
  const total = calculateServiceFee(pkg, hours);
  const address = selectedAddress(draft, user);
  const errors = attempted === step ? validateStep(step, context) : {};

  const update = (patch) =>
    setDraft((current) => {
      const changes = typeof patch === 'function' ? patch(current) : patch;
      const next = { ...current, ...changes };
      if (changes.date instanceof Date) next.date = toISODate(changes.date);
      return next;
    });

  const goTo = (target) => {
    setAttempted(null);
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.set('langkah', String(target));
      return params;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (Object.keys(validateStep(step, context)).length) {
      setAttempted(step);
      // Tunggu ringkasan error dirender, lalu fokuskan agar dibacakan pembaca layar.
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (step < 4) {
      goTo(step + 1);
      return;
    }
    // TODO(API): POST pesanan ke backend; sementara disimpan di data pesanan lokal.
    const code = createBooking(draftToBooking(context));
    clearDraft(profile.id);
    setDraft(createDraft({ profile, user }));
    setSearchParams({ langkah: 'selesai', kode: code }, { replace: true });
  };

  const stepProps = { profile, pkg, user, draft, date, hours, address, total, update, errors };
  const steps = BOOKING_STEPS.map((label, index) => ({
    label,
    done: step === 5 || index < step - 1,
  }));

  return (
    <>
      <section className="booking-hero" aria-labelledby="page-title">
        <div className="booking-hero__art" aria-hidden="true">
          <span className="booking-hero__blob" />
          <span className="booking-hero__ring" />
          <span className="booking-hero__tile" />
        </div>
        <div className="container booking-hero__content">
          <div className="booking-hero__intro">
            <h1 id="page-title" className="search-hero__title">
              Pesan Layanan
            </h1>
            <p className="search-hero__lead">{LEADS[step] ?? DEFAULT_LEAD}</p>
          </div>
          <BookingStepper steps={steps} />
        </div>
      </section>

      {step === 5 ? (
        <div className="container booking-done">
          <BookingSuccess booking={created} provider={profile} />
        </div>
      ) : (
        <div className={`container booking-layout${step === 4 ? ' booking-layout--single' : ''}`}>
          <form
            className="booking-form"
            aria-labelledby="step-title"
            noValidate
            onSubmit={handleSubmit}
          >
            <ErrorSummary ref={errorRef} errors={errors} />
            {step === 1 && <StepService {...stepProps} />}
            {step === 2 && (
              <StepSchedule {...stepProps} today={today} onChangeService={() => goTo(1)} />
            )}
            {step === 3 && <StepDetails {...stepProps} />}
            {step === 4 && <StepReview {...stepProps} goTo={goTo} />}
            {step === 1 ? (
              <StepNav
                back={
                  <Link
                    to={buildProviderPath(profile.id)}
                    className="btn btn--outline step-nav__back"
                  >
                    <ArrowLeftIcon />
                    Kembali ke Profil
                  </Link>
                }
              />
            ) : (
              <StepNav
                onBack={() => goTo(step - 1)}
                next={
                  step === 4 ? (
                    <button type="submit" className="btn btn--primary btn--xl step-nav__send">
                      <SendIcon />
                      Kirim Pesanan
                      <ArrowRightIcon />
                    </button>
                  ) : undefined
                }
              />
            )}
          </form>

          {step < 4 && (
            <aside className="booking-aside" aria-label="Ringkasan dan informasi">
              <OrderSummary
                provider={profile}
                pkg={pkg}
                date={date}
                start={draft.start}
                hours={hours}
                address={step >= 3 ? address : null}
                note={draft.note}
                total={total}
                detailsReached={step >= 3}
              />
              <BookingAssurance />
            </aside>
          )}
        </div>
      )}
    </>
  );
}
