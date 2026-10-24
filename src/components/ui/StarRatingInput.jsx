import { useId } from 'react';
import { RATING_LABELS } from '@/features/booking/customerBookings';
import { StarOutlineIcon } from './icons';

/**
 * Input rating bintang (pola radiogroup ARIA): satu tab stop, panah kiri/kanan/atas/bawah
 * mengubah nilai, Home/End ke nilai terendah/tertinggi.
 */
export default function StarRatingInput({
  value,
  onChange,
  labelledBy,
  label,
  size = 34,
  describe = true,
  className = '',
}) {
  const baseId = useId();
  const max = RATING_LABELS.length;
  const focusStar = (n) => document.getElementById(`${baseId}-${n}`)?.focus();

  const select = (n) => {
    onChange(n);
    focusStar(n);
  };

  const handleKeyDown = (event) => {
    const current = value || 0;
    const next = {
      ArrowRight: Math.min(current + 1, max),
      ArrowUp: Math.min(current + 1, max),
      ArrowLeft: Math.max(current - 1, 1),
      ArrowDown: Math.max(current - 1, 1),
      Home: 1,
      End: max,
    }[event.key];
    if (next) {
      event.preventDefault();
      select(next);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={`star-input ${className}`.trim()}
    >
      {RATING_LABELS.map((text, index) => {
        const n = index + 1;
        const checked = value === n;
        return (
          <button
            key={n}
            id={`${baseId}-${n}`}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={describe ? `${n} bintang, ${text}` : `${n} bintang`}
            tabIndex={checked || (!value && n === 1) ? 0 : -1}
            className={`star-input__star${n <= (value || 0) ? ' star-input__star--on' : ''}`}
            onClick={() => select(n)}
            onKeyDown={handleKeyDown}
          >
            <StarOutlineIcon size={size} strokeWidth={1.6} />
          </button>
        );
      })}
    </div>
  );
}
