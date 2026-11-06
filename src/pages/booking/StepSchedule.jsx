import { MAX_DURATION, formatLongDate } from '@/features/booking/schedule';
import { isHourly, minHoursOf, priceLabel, timeLabel } from '@/features/booking/bookingDraft';
import { BriefcaseIcon, CheckIcon, ClockIcon, MinusIcon, PlusIcon } from '@/components/ui/icons';
import BookingCalendar from './BookingCalendar';
import { StepHeading } from './StepParts';

/**
 * Langkah 2 — tanggal, jam mulai, dan durasi. Jam mulai (`slots`) dihitung dari jadwal
 * penyedia pada tanggal terpilih; durasi dibatasi minimal paket dan jam tutup slot.
 */
export default function StepSchedule({
  profile,
  pkg,
  draft,
  date,
  hours,
  slots,
  today,
  update,
  errors,
  onChangeService,
}) {
  const hourly = isHourly(pkg);
  const minHours = minHoursOf(pkg);
  const maxHours = slots.find((s) => s.slot === draft.start)?.maxHours ?? MAX_DURATION;

  const pickStart = ({ slot, maxHours: limit }) => {
    update({ start: slot, duration: Math.max(minHours, Math.min(draft.duration, limit)) });
  };

  return (
    <>
      <StepHeading
        step={2}
        title="Pilih Jadwal"
        description={
          hourly
            ? 'Tentukan tanggal, jam mulai, dan durasi layanan.'
            : 'Tentukan tanggal dan jam mulai layanan.'
        }
      />

      <section className="selected-package" aria-label="Paket terpilih">
        <span className="icon-tile icon-tile--soft" aria-hidden="true">
          <BriefcaseIcon size={22} />
        </span>
        <p>
          <strong>{pkg.title}</strong> · {profile.name} ·{' '}
          <strong className="selected-package__price">{priceLabel(pkg)}</strong>
        </p>
        <button
          type="button"
          className="text-action"
          aria-label="Ubah layanan, kembali ke langkah 1"
          onClick={onChangeService}
        >
          Ubah
        </button>
      </section>

      <div className="schedule-grid">
        <section className="booking-card" aria-labelledby="lbl-tanggal">
          <h3 id="lbl-tanggal" className="booking-card__title booking-card__title--sm">
            Pilih Tanggal{' '}
            <span className="field-required" aria-hidden="true">
              *
            </span>
          </h3>
          <div id="booking-date" tabIndex={-1} className="booking-card__anchor">
            <BookingCalendar
              today={today}
              value={date}
              workDays={profile.workDays}
              onChange={(value) => update({ date: value })}
              labelId="lbl-tanggal"
              invalid={Boolean(errors['booking-date'])}
            />
          </div>
          {errors['booking-date'] && <p className="field-error">{errors['booking-date']}</p>}
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
              Tidak tersedia (lewat / libur)
            </li>
          </ul>
        </section>

        <section className="booking-card" aria-labelledby="lbl-waktu">
          <h3 id="lbl-waktu" className="booking-card__title booking-card__title--sm">
            Pilih Waktu Mulai{' '}
            <span className="field-required" aria-hidden="true">
              *
            </span>
          </h3>
          <p className="field-hint field-hint--icon">
            <ClockIcon size={16} />
            Jam layanan penyedia: {profile.hours}
          </p>
          <div
            id="booking-time"
            tabIndex={-1}
            role="group"
            aria-labelledby="lbl-waktu"
            className="time-slots time-slots--3"
          >
            {slots.map((option) => (
              <button
                key={option.slot}
                type="button"
                className="time-slot"
                aria-label={`${option.slot} WIB`}
                aria-pressed={draft.start === option.slot}
                onClick={() => pickStart(option)}
              >
                {draft.start === option.slot && <CheckIcon size={18} />}
                {option.slot}
              </button>
            ))}
          </div>
          {!slots.length && (
            <p className="field-hint" role="status">
              {date
                ? 'Tidak ada jam tersisa di tanggal ini. Pilih tanggal lain.'
                : 'Pilih tanggal terlebih dahulu untuk melihat jam yang tersedia.'}
            </p>
          )}
          {errors['booking-time'] && <p className="field-error">{errors['booking-time']}</p>}
        </section>
      </div>

      {hourly && (
        <section className="booking-card duration-card" aria-labelledby="lbl-durasi">
          <div>
            <h3 id="lbl-durasi" className="booking-card__title booking-card__title--sm">
              Durasi
            </h3>
            <p id="durasi-help" className="field-hint">
              {pkg.estimate ? `${pkg.estimate} · ` : ''}minimal {minHours} jam, maksimal{' '}
              {Math.max(MAX_DURATION, minHours)} jam.
              {draft.start && maxHours < MAX_DURATION && (
                <>
                  {' '}
                  Dari jam {draft.start} paling lama {maxHours} jam (sebelum jam tutup penyedia).
                </>
              )}
            </p>
          </div>
          <div
            className="duration-stepper"
            role="group"
            aria-labelledby="lbl-durasi"
            aria-describedby="durasi-help"
          >
            <button
              type="button"
              className="duration-stepper__btn"
              aria-label="Kurangi durasi"
              disabled={hours <= minHours}
              onClick={() => update({ duration: hours - 1 })}
            >
              <MinusIcon size={22} strokeWidth={2.5} />
            </button>
            <output className="duration-stepper__value" aria-live="polite">
              {hours} jam
            </output>
            <button
              type="button"
              className="duration-stepper__btn"
              aria-label="Tambah durasi"
              disabled={hours >= maxHours}
              onClick={() => update({ duration: hours + 1 })}
            >
              <PlusIcon size={22} strokeWidth={2.5} />
            </button>
          </div>
        </section>
      )}

      <p className="selection-note" aria-live="polite">
        <ClockIcon size={22} />
        <span>
          Terpilih:{' '}
          <strong>
            {date && draft.start
              ? `${formatLongDate(date)} · ${timeLabel(draft.start, hours, hourly)}`
              : 'belum lengkap'}
          </strong>
        </span>
      </p>
    </>
  );
}
