import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { swapIn } from '@/lib/motion';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/context/useAuth';
import { useCustomer } from '@/context/useCustomer';
import { useProviderProfile } from '@/features/providers/useProviderProfile';
import { createBooking as createBookingRequest } from '@/features/booking/bookingApi';
import {
  calculateServiceFee,
  parseISODate,
  startOfDay,
  toISODate,
} from '@/features/booking/schedule';
import {
  BOOKING_STEPS,
  bookableSlots,
  clearDraft,
  createDraft,
  draftToApiPayload,
  draftToBooking,
  effectiveDuration,
  firstIncompleteStep,
  loadDraft,
  loadOrigin,
  saveDraft,
  saveOrigin,
  selectedAddress,
  validateStep,
} from '@/features/booking/bookingDraft';
import { findBooking } from '@/features/booking/customerBookings';
import { findPaymentMethod, seededDigits } from '@/features/booking/payment';
import { homePathFor } from '@/features/auth/session';
import { lastVisitedPath } from '@/hooks/useNavigationTrail';
import { ensureThread } from '@/features/chat/chatStore';
import { PATHS, buildAuthPath, buildBookingPath, buildProviderPath } from '@/routes/paths';
import { ArrowLeftIcon, ArrowRightIcon, LogInIcon, WalletIcon } from '@/components/ui/icons';
import ProviderStatus from '@/pages/providers/ProviderStatus';
import BookingStepper from './BookingStepper';
import OrderSummary from './OrderSummary';
import StepService from './StepService';
import StepSchedule from './StepSchedule';
import StepDetails from './StepDetails';
import StepReview from './StepReview';
import BookingSuccessDialog from './BookingSuccess';
import PaymentDialog from './PaymentDialog';
import { BookingAssurance, ErrorSummary, GuestLoginNote, StepNav } from './StepParts';
import './booking.css';
import './bookingSteps.css';

const LEADS = {
  4: 'Satu langkah lagi. Periksa pesanan Anda, pilih metode pembayaran, lalu bayar.',
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
  // Muat ulang di tengah alur (?langkah=…) atau kembali dari halaman Masuk → lanjutkan draf.
  const stored = searchParams.has('langkah') ? loadDraft(profile.id) : null;
  if (!stored) return base;
  const draft = { ...base, ...stored, agree: false };
  // Draf dari tamu belum punya alamat (atau alamatnya sudah tidak ada): pakai alamat utama
  // akun yang baru masuk.
  if (!selectedAddress(draft, user)) draft.addressId = base.addressId;
  return draft;
}

/** Halaman yang tidak dijadikan tujuan tombol Kembali: alur pesan itu sendiri & halaman akun. */
const NOT_ORIGIN = [
  '/pesan/',
  PATHS.login,
  PATHS.register,
  PATHS.forgotPassword,
  PATHS.resetPassword,
];
const isOrigin = (path) => !NOT_ORIGIN.some((prefix) => path.startsWith(prefix));

/**
 * Tujuan tombol Kembali di langkah 1: halaman tempat pengguna menekan "Pesan" (Cari Layanan,
 * profil penyedia, Beranda, …). Disimpan per penyedia agar tetap benar setelah masuk akun
 * atau muat ulang; tanpa jejak (mis. tautan dibuka langsung) kembali ke profil penyedia.
 */
function bookingOrigin(providerId) {
  const visited = lastVisitedPath((path) => !isOrigin(path));
  if (visited) {
    saveOrigin(providerId, visited);
    return visited;
  }
  return loadOrigin(providerId) ?? buildProviderPath(providerId);
}

/** Langkah terakhir yang boleh diisi tamu (belum masuk): Pilih Layanan & Jadwal. */
const GUEST_LAST_STEP = 2;

/** Field error backend (B1) → langkah yang perlu diubah pengguna. */
const FIELD_STEP = {
  service_id: 1,
  service_mode: 1,
  scheduled_date: 2,
  start_time: 2,
  quantity: 2,
  location_area: 3,
  location_address: 3,
  customer_note: 3,
};
const STEP_LABEL = { 1: 'Ubah layanan', 2: 'Ubah jadwal', 3: 'Ubah detail pesanan' };

/** Pesan gagal kirim dari respons backend: pesan utama + pesan per isian (bila ada). */
function submitErrorOf(error) {
  if (error?.code === 'ERR_NET_FAIL') {
    return { message: error.message, fields: [], step: null };
  }
  const fields = Array.isArray(error?.details) ? error.details.filter((item) => item?.message) : [];
  const step = fields.map((item) => FIELD_STEP[item.field]).find(Boolean) ?? null;
  return {
    message: error?.message || 'Pesanan belum berhasil dikirim. Coba lagi.',
    fields: fields.map((item) => item.message),
    step,
  };
}

/**
 * Pesan Layanan (FR-CUST-06/07) — 4 langkah, lalu pop-up sukses (desain pesan-layanan-1…5).
 * Langkah aktif ada di URL (?langkah=2) sehingga tombol Back browser berpindah langkah;
 * langkah yang prasyaratnya belum lengkap dikembalikan ke langkah pertama yang belum lengkap.
 * Tamu hanya sampai langkah 2 (jadwal); "Lanjut" membawanya ke halaman Masuk dan, setelah
 * berhasil masuk, kembali ke langkah 3 (Detail Pesanan) dengan draf yang tersimpan.
 * Profil, paket, dan jadwal dari GET /providers/:id; "Kirim Pesanan" = POST /bookings.
 */
export default function BookingPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { status, profile, retry } = useProviderProfile(id);
  useDocumentTitle(profile || status !== 'notfound' ? 'Pesan Layanan' : 'Penyedia tidak ditemukan');

  // Akun penyedia/admin/pengelola tidak memesan layanan.
  if (user && user.role !== 'customer') return <Navigate to={homePathFor(user.role)} replace />;

  if (!profile || !profile.packages.length) {
    return (
      <ProviderStatus
        status={profile ? 'notfound' : status}
        onRetry={retry}
        notFoundLead="Pemesanan tidak dapat dilanjutkan karena penyedia atau layanannya tidak tersedia."
      />
    );
  }
  return <BookingFlow key={profile.id} profile={profile} user={user} />;
}

function BookingFlow({ profile, user }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bookings, createBooking } = useCustomer();

  const today = startOfDay(new Date());
  const [draft, setDraft] = useState(() => initialDraft(profile, user, searchParams, today));
  const [origin] = useState(() => bookingOrigin(profile.id));
  const [attempted, setAttempted] = useState(null);
  const [createdCode, setCreatedCode] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  // Metode pembayaran yang layarnya (dummy) sedang terbuka, atau null.
  const [paying, setPaying] = useState(null);
  const errorRef = useRef(null);
  const submitErrorRef = useRef(null);
  const previousStep = useRef(null);

  const context = { draft, profile, user, today };
  // Pesanan yang baru terkirim → pop-up sukses di atas langkah 4.
  const created = createdCode ? findBooking(bookings, createdCode) : null;
  const requested = Number(searchParams.get('langkah')) || 1;
  const maxStep = user ? 4 : GUEST_LAST_STEP;
  const step = Math.max(1, Math.min(requested, maxStep, firstIncompleteStep(context)));

  useEffect(() => {
    if (!createdCode && step >= 1 && step <= 4) saveDraft(profile.id, draft);
  }, [profile, draft, step, createdCode]);

  // Pindah langkah: kembali ke atas lalu fokus ke judul langkah (bukan saat halaman pertama dibuka).
  useEffect(() => {
    if (previousStep.current !== null && previousStep.current !== step && step <= 4) {
      window.scrollTo(0, 0);
      document.getElementById('step-title')?.focus({ preventScroll: true });
    }
    previousStep.current = step;
  }, [step]);

  const pkg = profile.packages.find((p) => p.id === draft.packageId);
  const date = parseISODate(draft.date);
  const slots = bookableSlots({ draft, profile, pkg });
  const hours = effectiveDuration(draft, pkg, slots);
  const total = calculateServiceFee(pkg, hours);
  const address = selectedAddress(draft, user);
  const errors = attempted === step ? validateStep(step, context) : {};
  const paymentReference = `DJC-PAY-${seededDigits(`${profile.id}:${draft.date}:${draft.start}:${draft.paymentMethod}`, 8)}`;

  const update = (patch) =>
    setDraft((current) => {
      const changes = typeof patch === 'function' ? patch(current) : patch;
      const next = { ...current, ...changes };
      if (changes.date instanceof Date) next.date = toISODate(changes.date);
      return next;
    });

  const goTo = (target) => {
    setAttempted(null);
    setSubmitError(null);
    setSearchParams((current) => {
      const params = new URLSearchParams(current);
      params.set('langkah', String(target));
      return params;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (Object.keys(validateStep(step, context)).length) {
      setAttempted(step);
      // Tunggu ringkasan error dirender, lalu fokuskan agar dibacakan pembaca layar.
      requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }
    if (!user && step >= GUEST_LAST_STEP) {
      // Simpan draf sekarang (efek penyimpanan belum tentu jalan sebelum pindah halaman),
      // lalu minta masuk; setelah berhasil kembali ke Detail Pesanan.
      saveDraft(profile.id, draft);
      const resume = buildBookingPath(profile.id, { langkah: String(GUEST_LAST_STEP + 1) });
      navigate(buildAuthPath(PATHS.login, resume));
      return;
    }
    if (step < 4) {
      goTo(step + 1);
      return;
    }
    // Langkah 4: buka layar pembayaran (simulasi); pesanan dikirim setelah "Saya sudah bayar".
    setSubmitError(null);
    setPaying(findPaymentMethod(draft.paymentMethod));
  };

  /** Kirim pesanan (POST /bookings) setelah pembayaran simulasi dikonfirmasi. */
  const sendBooking = async () => {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    let created;
    try {
      created = await createBookingRequest(draftToApiPayload(context));
    } catch (error) {
      setSubmitting(false);
      setPaying(null);
      if (error?.status === 401) {
        // Sesi di server habis: masuk lagi, lalu kembali ke langkah 4 dengan draf yang sama.
        saveDraft(profile.id, draft);
        navigate(buildAuthPath(PATHS.login, buildBookingPath(profile.id, { langkah: '4' })));
        return;
      }
      setSubmitError(submitErrorOf(error));
      requestAnimationFrame(() => submitErrorRef.current?.focus());
      return;
    }
    setSubmitting(false);
    // Simpan juga di data pesanan lokal agar pop-up sukses & Pesanan Saya langsung menampilkannya.
    const code = createBooking(draftToBooking(context, created));
    // Buka percakapan chat pesanan ini agar langsung muncul di kotak masuk penyedia.
    ensureThread({
      code,
      providerId: profile.id,
      providerName: profile.name,
      customerName: user.name,
      service: pkg.title,
    });
    clearDraft(profile.id);
    setPaying(null);
    setCreatedCode(code);
  };

  // Menutup pop-up (✕ / Escape) → ke Pesanan Saya, tempat pesanan baru sudah tercantum.
  const closeSuccess = () => navigate(PATHS.customerBookings, { replace: true });

  const stepProps = {
    profile,
    pkg,
    user,
    draft,
    date,
    hours,
    slots,
    address,
    total,
    update,
    errors,
  };
  const steps = BOOKING_STEPS.map((label, index) => ({
    label,
    done: Boolean(created) || index < step - 1,
  }));

  return (
    <>
      <section className="booking-hero" aria-labelledby="page-title">
        <div className="container booking-hero__content">
          <div className="booking-hero__intro">
            <h1 id="page-title" className="search-hero__title">
              Pesan Layanan
            </h1>
            <p className="search-hero__lead">{LEADS[created ? 5 : step] ?? DEFAULT_LEAD}</p>
          </div>
          <BookingStepper steps={steps} />
        </div>
      </section>

      <PaymentDialog
        method={created ? null : paying}
        total={total}
        reference={paymentReference}
        submitting={submitting}
        onPaid={sendBooking}
        onClose={() => setPaying(null)}
      />
      <BookingSuccessDialog booking={created} provider={profile} onClose={closeSuccess} />

      <div className={`container booking-layout${step === 4 ? ' booking-layout--single' : ''}`}>
        <form
          className="booking-form"
          aria-labelledby="step-title"
          noValidate
          onSubmit={handleSubmit}
        >
          <ErrorSummary ref={errorRef} errors={errors} />
          {submitError && (
            <div
              ref={submitErrorRef}
              className="error-summary"
              role="alert"
              tabIndex={-1}
              aria-labelledby="submit-error-title"
            >
              <h3 id="submit-error-title">Pesanan belum terkirim</h3>
              <p>{submitError.message}</p>
              {submitError.fields.length > 0 && (
                <ul>
                  {submitError.fields.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              )}
              {submitError.step && (
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => goTo(submitError.step)}
                >
                  {STEP_LABEL[submitError.step]}
                </button>
              )}
            </div>
          )}
          {/* Isi langkah baru bergeser masuk dari arah "maju" (key = langkah). */}
          <motion.div key={step} className="booking-step" {...swapIn}>
            {step === 1 && <StepService {...stepProps} />}
            {step === 2 && (
              <StepSchedule {...stepProps} today={today} onChangeService={() => goTo(1)} />
            )}
            {step === 3 && <StepDetails {...stepProps} />}
            {step === 4 && <StepReview {...stepProps} goTo={goTo} />}
          </motion.div>
          {!user && step === GUEST_LAST_STEP && <GuestLoginNote />}
          {step === 1 ? (
            <StepNav
              back={
                <Link to={origin} className="btn btn--outline step-nav__back">
                  <ArrowLeftIcon />
                  Kembali
                </Link>
              }
            />
          ) : (
            <StepNav
              onBack={() => goTo(step - 1)}
              next={
                !user ? (
                  <button type="submit" className="btn btn--primary step-nav__next">
                    <LogInIcon size={20} />
                    Masuk untuk Lanjut
                  </button>
                ) : step === 4 ? (
                  <button
                    type="submit"
                    className="btn btn--primary btn--xl step-nav__send"
                    disabled={submitting}
                    aria-busy={submitting}
                  >
                    <WalletIcon />
                    Lanjut ke Pembayaran
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
    </>
  );
}
