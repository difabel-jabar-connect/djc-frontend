import { useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isDev } from '@/config/env';
import { getProviderProfile, PAYMENT_METHODS } from '@/features/providers/providerProfiles';
import {
  calculateServiceFee,
  formatLongDate,
  formatShortDate,
  formatSlotRange,
  parseISODate,
  SAMPLE_FULL_SLOTS,
  startOfDay,
  TIME_SLOTS,
  toggleSlot,
} from '@/features/booking/schedule';
import { formatRating, formatRupiah } from '@/lib/format';
import { buildProviderPath, PATHS } from '@/routes/paths';
import {
  BankIcon,
  CashIcon,
  CheckBadgeIcon,
  CheckIcon,
  ClipboardCheckIcon,
  ClockIcon,
  CrosshairIcon,
  MapPinIcon,
  ShieldIcon,
  StarFilledIcon,
  WalletIcon,
  ZapIcon,
} from '@/components/ui/icons';
import BookingStepper from './BookingStepper';
import BookingCalendar from './BookingCalendar';
import OrderSummary from './OrderSummary';
import './booking.css';

const FORM_ID = 'booking-form';
const NOTE_MAX = 300;
const PAYMENT_ICONS = { transfer: BankIcon, ewallet: WalletIcon, cod: CashIcon };

/** Validasi form; kunci = id field yang dituju tautan ringkasan error. */
function validate({ pkg, date, slots, address, payment }) {
  const errors = {};
  if (!pkg) errors['booking-package'] = 'Pilih paket layanan.';
  if (!date) errors['booking-date'] = 'Pilih tanggal layanan.';
  if (!slots.length) errors['booking-time'] = 'Pilih minimal satu slot waktu.';
  if (!address.trim()) errors.alamat = 'Isi alamat lengkap lokasi layanan.';
  if (!payment) errors['booking-payment'] = 'Pilih metode pembayaran.';
  return errors;
}

/** Halaman Pemesanan Layanan (FR-CUST-06/07). Data dikirim ke API setelah endpoint tersedia. */
export default function BookingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const profile = getProviderProfile(id);
  useDocumentTitle(profile ? 'Pemesanan Layanan' : 'Penyedia tidak ditemukan');

  const today = startOfDay(new Date());
  const requestedDate = parseISODate(searchParams.get('tanggal'));
  const [packageId, setPackageId] = useState(
    () =>
      profile?.packages.find((p) => p.id === searchParams.get('paket'))?.id ??
      profile?.packages[0]?.id,
  );
  const [showPackages, setShowPackages] = useState(false);
  const [date, setDate] = useState(() =>
    requestedDate && requestedDate >= today && profile?.workDays.includes(requestedDate.getDay())
      ? requestedDate
      : null,
  );
  const [slots, setSlots] = useState([]);
  const [address, setAddress] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState(profile?.paymentMethods[0] ?? '');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const errorSummaryRef = useRef(null);

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

  const pkg = profile.packages.find((p) => p.id === packageId);
  const serviceFee = calculateServiceFee(pkg, slots.length);
  const values = { pkg, date, slots, address, payment };
  const fieldError = (key) => (Object.keys(errors).length ? validate(values)[key] : undefined);

  const steps = [
    { label: 'Pilih Layanan', done: Boolean(pkg) },
    { label: 'Jadwal', done: Boolean(date && slots.length) },
    { label: 'Detail Pemesanan', done: Boolean(address.trim()) },
    { label: 'Konfirmasi', done: submitted },
  ];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus(
        'Browser Anda tidak mendukung deteksi lokasi. Silakan isi alamat secara manual.',
      );
      return;
    }
    setGeoStatus('Mendeteksi lokasi Anda…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setAddress(
          (current) =>
            `${current ? `${current}\n` : ''}Titik lokasi: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        );
        setGeoStatus('Titik lokasi ditambahkan. Lengkapi nama jalan dan nomor rumah.');
      },
      () => setGeoStatus('Lokasi tidak dapat diakses. Silakan isi alamat secara manual.'),
      { timeout: 10000 },
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      // Tunggu ringkasan error dirender, lalu fokuskan agar dibacakan pembaca layar.
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    // TODO(API): kirim pesanan ke endpoint booking backend.
    setSubmitted(true);
    window.scrollTo(0, 0);
  };

  const errorEntries = Object.entries(Object.keys(errors).length ? validate(values) : {});

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
              Pemesanan Layanan
            </h1>
            <p className="search-hero__lead">
              Lengkapi detail pemesanan untuk mendapatkan layanan dari penyedia terpercaya Difabel
              Jabar Connect.
            </p>
          </div>
          <BookingStepper steps={steps} />
        </div>
      </section>

      <div className="container booking-layout">
        {submitted ? (
          <section className="booking-success" aria-labelledby="success-title" tabIndex={-1}>
            <CheckBadgeIcon size={56} className="booking-success__icon" />
            <h2 id="success-title">Pesanan berhasil dibuat</h2>
            <p>
              {pkg.title} bersama {profile.name} pada {formatLongDate(date)},{' '}
              {formatSlotRange(slots)}. Penyedia akan mengonfirmasi pesanan Anda maksimal 1 jam.
            </p>
            {isDev && (
              <p className="booking-success__dev">
                Mode development: pesanan belum dikirim ke server (API booking belum tersedia).
              </p>
            )}
            <div className="booking-success__actions">
              <Link to={PATHS.customerBookings} className="btn btn--primary">
                Lihat Pesanan Saya
              </Link>
              <Link to={PATHS.services} className="btn btn--outline">
                Cari Layanan Lain
              </Link>
            </div>
          </section>
        ) : (
          <form
            id={FORM_ID}
            className="booking-form"
            aria-label="Form pemesanan"
            noValidate
            onSubmit={handleSubmit}
          >
            {errorEntries.length > 0 && (
              <div
                ref={errorSummaryRef}
                className="error-summary"
                role="alert"
                tabIndex={-1}
                aria-labelledby="error-summary-title"
              >
                <h2 id="error-summary-title">
                  Periksa kembali {errorEntries.length} isian berikut
                </h2>
                <ul>
                  {errorEntries.map(([field, message]) => (
                    <li key={field}>
                      <a href={`#${field}`}>{message}</a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 1. Penyedia */}
            <section className="booking-card" aria-labelledby="s1">
              <h2 id="s1" className="booking-card__title">
                1. Penyedia Layanan
              </h2>
              <div className="booking-provider">
                <div className="booking-provider__identity">
                  <span
                    className="booking-provider__avatar"
                    style={{ backgroundColor: profile.avatarColor }}
                    aria-hidden="true"
                  >
                    {profile.initials}
                  </span>
                  <div>
                    <p className="booking-provider__name">{profile.name}</p>
                    <p className="booking-provider__meta">
                      <StarFilledIcon size={16} className="text-star" />
                      <span className="visually-hidden">Rating</span>
                      <strong>{formatRating(profile.rating)}</strong> ({profile.reviewCount} ulasan)
                      · {profile.category}
                    </p>
                    <p className="booking-provider__meta">
                      <MapPinIcon size={16} />
                      {profile.city}
                      {profile.joinedYear ? ` · Bergabung sejak ${profile.joinedYear}` : ''}
                    </p>
                  </div>
                </div>
                <ul className="booking-provider__highlights">
                  {profile.highlights.map((item) => (
                    <li key={item}>
                      <CheckBadgeIcon />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link to={buildProviderPath(profile.id)} className="btn btn--outline">
                  Lihat Profil
                </Link>
              </div>
            </section>

            {/* 2. Paket */}
            <section
              className="booking-card"
              aria-labelledby="s2"
              id="booking-package"
              tabIndex={-1}
            >
              <h2 id="s2" className="booking-card__title">
                2. Pilih Paket Layanan
              </h2>
              {pkg && !showPackages && (
                <div className="booking-package">
                  <span className="icon-tile icon-tile--xl" aria-hidden="true">
                    <img src={profile.categoryIcon} alt="" width="30" height="30" />
                  </span>
                  <div className="booking-package__info">
                    <p className="booking-package__title">{pkg.title}</p>
                    <p className="booking-package__desc">{pkg.description}</p>
                    <p className="booking-package__meta">
                      <strong>
                        {formatRupiah(pkg.priceFrom)}
                        {pkg.priceUnit && <span>/{pkg.priceUnit}</span>}
                      </strong>
                      {pkg.estimate && (
                        <span>
                          <ClockIcon size={16} />
                          {pkg.estimate}
                        </span>
                      )}
                    </p>
                  </div>
                  {profile.packages.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--outline"
                      aria-expanded={showPackages}
                      onClick={() => setShowPackages(true)}
                    >
                      Ubah Layanan
                    </button>
                  )}
                </div>
              )}
              {showPackages && (
                <fieldset className="package-options">
                  <legend className="visually-hidden">Paket layanan</legend>
                  {profile.packages.map((option) => (
                    <label key={option.id} className="option-card">
                      <input
                        type="radio"
                        name="paket"
                        value={option.id}
                        checked={packageId === option.id}
                        onChange={() => {
                          setPackageId(option.id);
                          setShowPackages(false);
                        }}
                      />
                      <strong className="option-card__title">{option.title}</strong>
                      <span className="option-card__desc">
                        {formatRupiah(option.priceFrom)}
                        {option.priceUnit ? `/${option.priceUnit}` : ''} · {option.description}
                      </span>
                    </label>
                  ))}
                </fieldset>
              )}
            </section>

            {/* 3. Jadwal */}
            <section className="booking-card" aria-labelledby="s3">
              <h2 id="s3" className="booking-card__title">
                3. Pilih Jadwal
              </h2>
              <div className="booking-schedule">
                <div className="booking-schedule__date" id="booking-date" tabIndex={-1}>
                  <p id="lbl-tanggal" className="field-label">
                    Pilih Tanggal
                  </p>
                  <BookingCalendar
                    today={today}
                    value={date}
                    workDays={profile.workDays}
                    onChange={setDate}
                    labelId="lbl-tanggal"
                    invalid={Boolean(fieldError('booking-date'))}
                  />
                  {fieldError('booking-date') && (
                    <p className="field-error">{fieldError('booking-date')}</p>
                  )}
                  <ul className="calendar-legend" aria-label="Keterangan kalender">
                    <li>
                      <span className="calendar-legend__swatch calendar-legend__swatch--selected" />
                      Dipilih
                    </li>
                    <li>
                      <span className="calendar-legend__swatch calendar-legend__swatch--today" />
                      Hari ini
                    </li>
                    <li>
                      <span className="calendar-legend__swatch calendar-legend__swatch--off" />
                      Sudah lewat / libur
                    </li>
                  </ul>
                </div>

                <div className="booking-schedule__time" id="booking-time" tabIndex={-1}>
                  <p id="lbl-waktu" className="field-label">
                    Pilih Waktu
                  </p>
                  <p className="field-hint">Pilih satu atau beberapa jam berurutan.</p>
                  <div role="group" aria-labelledby="lbl-waktu" className="time-slots">
                    {TIME_SLOTS.map((slot) =>
                      SAMPLE_FULL_SLOTS.includes(slot) ? (
                        <button
                          key={slot}
                          type="button"
                          className="time-slot"
                          disabled
                          aria-label={`${slot}, penuh`}
                        >
                          <s>{slot}</s>
                          <span className="time-slot__full">Penuh</span>
                        </button>
                      ) : (
                        <button
                          key={slot}
                          type="button"
                          className="time-slot"
                          aria-pressed={slots.includes(slot)}
                          onClick={() =>
                            setSlots((current) =>
                              toggleSlot(current, slot, TIME_SLOTS, SAMPLE_FULL_SLOTS),
                            )
                          }
                        >
                          {slots.includes(slot) && <CheckIcon size={18} />}
                          {slot}
                        </button>
                      ),
                    )}
                  </div>
                  {fieldError('booking-time') && (
                    <p className="field-error">{fieldError('booking-time')}</p>
                  )}
                  <div className="selection-note">
                    <ClockIcon />
                    <p aria-live="polite">
                      Terpilih:{' '}
                      <strong>
                        {date && slots.length
                          ? `${formatShortDate(date)} · ${formatSlotRange(slots)}`
                          : 'belum lengkap'}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <div className="booking-pair">
              {/* 4. Alamat */}
              <section className="booking-card" aria-labelledby="s4">
                <h2 id="s4" className="booking-card__title">
                  4. Alamat Layanan
                </h2>
                <div className="field">
                  <label htmlFor="alamat" className="field-label">
                    Alamat lengkap{' '}
                    <span className="field-required" aria-hidden="true">
                      *
                    </span>
                    <span className="visually-hidden">(wajib)</span>
                  </label>
                  <div
                    className={`input-shell input-shell--area${fieldError('alamat') ? ' input-shell--invalid' : ''}`}
                  >
                    <MapPinIcon className="input-shell__icon input-shell__icon--top" />
                    <textarea
                      id="alamat"
                      rows={3}
                      required
                      className="input-shell__control"
                      placeholder="Contoh: Jl. Cigadung Raya No. 12, Cibeunying Kaler, Bandung"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      aria-invalid={Boolean(fieldError('alamat'))}
                      aria-describedby={fieldError('alamat') ? 'alamat-error' : undefined}
                    />
                  </div>
                  {fieldError('alamat') && (
                    <p id="alamat-error" className="field-error">
                      {fieldError('alamat')}
                    </p>
                  )}
                  <button
                    type="button"
                    className="link-button link-button--flush"
                    onClick={detectLocation}
                  >
                    <CrosshairIcon />
                    Gunakan Lokasi Saya
                  </button>
                  {geoStatus && (
                    <p className="field-hint" role="status">
                      {geoStatus}
                    </p>
                  )}
                </div>
              </section>

              {/* 5. Catatan */}
              <section className="booking-card" aria-labelledby="s5">
                <h2 id="s5" className="booking-card__title">
                  5. Catatan Tambahan <span className="booking-card__optional">(Opsional)</span>
                </h2>
                <div className="field">
                  <label htmlFor="catatan" className="field-label">
                    Catatan untuk penyedia
                  </label>
                  <div className="input-shell input-shell--area">
                    <textarea
                      id="catatan"
                      rows={3}
                      maxLength={NOTE_MAX}
                      className="input-shell__control"
                      placeholder="Contoh: fokus bersihkan dapur dan kamar mandi, ada kucing di rumah."
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      aria-describedby="catatan-count"
                    />
                  </div>
                  <p id="catatan-count" className="field-count">
                    {note.length}/{NOTE_MAX} karakter
                  </p>
                </div>
              </section>
            </div>

            {/* 6. Pembayaran */}
            <fieldset className="booking-card booking-payment" id="booking-payment" tabIndex={-1}>
              <legend className="booking-card__title">6. Metode Pembayaran</legend>
              <div className="payment-options">
                {profile.paymentMethods.map((key) => {
                  const method = PAYMENT_METHODS[key];
                  const Icon = PAYMENT_ICONS[key];
                  const checked = payment === key;
                  return (
                    <label key={key} className="payment-option">
                      <span className="payment-option__top">
                        <span
                          className={`icon-tile${checked ? ' icon-tile--primary' : ' icon-tile--soft'}`}
                          aria-hidden="true"
                        >
                          <Icon size={22} />
                        </span>
                        <input
                          type="radio"
                          name="bayar"
                          value={key}
                          checked={checked}
                          onChange={() => setPayment(key)}
                        />
                      </span>
                      <span>
                        <strong>{method.label}</strong>
                        <span className="payment-option__desc">{method.description}</span>
                      </span>
                      {checked && (
                        <span className="payment-option__chosen">
                          <CheckIcon size={16} />
                          Dipilih
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </form>
        )}

        <aside className="booking-aside" aria-label="Ringkasan dan informasi">
          {!submitted && (
            <OrderSummary
              formId={FORM_ID}
              provider={profile}
              pkg={pkg}
              date={date}
              slots={slots}
              address={address}
              note={note}
              serviceFee={serviceFee}
            />
          )}
          <div className="booking-note">
            <span className="icon-tile icon-tile--primary" aria-hidden="true">
              <ClipboardCheckIcon size={22} />
            </span>
            <span>
              <strong>Form sederhana dan mudah diisi</strong>
              <span className="booking-note__text">
                Bisa diisi dengan keyboard atau pembaca layar.
              </span>
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
                <ZapIcon size={20} />
              </span>
              <strong>Konfirmasi cepat</strong>
              <span>Respons maks. 1 jam.</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
