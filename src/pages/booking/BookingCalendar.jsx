import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';
import {
  buildMonthGrid,
  formatLongDate,
  formatMonthYear,
  toISODate,
} from '@/features/booking/schedule';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

/**
 * Kalender pilih tanggal. Tanggal lewat & hari libur penyedia tidak bisa dipilih.
 * Setiap tombol punya label lengkap ("Selasa, 20 Oktober 2026, hari ini").
 */
export default function BookingCalendar({ today, value, workDays, onChange, labelId, invalid }) {
  const initial = value ?? today;
  const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
  const cells = buildMonthGrid(view.year, view.month);
  const isCurrentMonth = view.year === today.getFullYear() && view.month === today.getMonth();
  const todayIso = toISODate(today);
  const selectedIso = value ? toISODate(value) : '';

  const shiftMonth = (delta) =>
    setView(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });

  return (
    <div className={`calendar${invalid ? ' calendar--invalid' : ''}`}>
      <div className="calendar__head">
        <button
          type="button"
          className="calendar__nav"
          aria-label="Bulan sebelumnya"
          onClick={() => shiftMonth(-1)}
          disabled={isCurrentMonth}
        >
          <ChevronLeftIcon strokeWidth={2.25} />
        </button>
        <p className="calendar__month" aria-live="polite">
          {formatMonthYear(new Date(view.year, view.month, 1))}
        </p>
        <button
          type="button"
          className="calendar__nav"
          aria-label="Bulan berikutnya"
          onClick={() => shiftMonth(1)}
        >
          <ChevronRightIcon strokeWidth={2.25} />
        </button>
      </div>
      <div className="calendar__grid" role="group" aria-labelledby={labelId}>
        {WEEKDAYS.map((day) => (
          <span key={day} className="calendar__weekday" aria-hidden="true">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} aria-hidden="true" />;
          const iso = toISODate(date);
          const past = iso < todayIso;
          const closed = !workDays.includes(date.getDay());
          const selected = iso === selectedIso;
          const isToday = iso === todayIso;
          const notes = [isToday && 'hari ini', closed && !past && 'libur', selected && 'dipilih']
            .filter(Boolean)
            .join(', ');
          return (
            <button
              key={iso}
              type="button"
              className={`calendar__day${isToday ? ' calendar__day--today' : ''}`}
              aria-label={`${formatLongDate(date)}${notes ? `, ${notes}` : ''}`}
              aria-pressed={selected}
              disabled={past || closed}
              onClick={() => onChange(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
