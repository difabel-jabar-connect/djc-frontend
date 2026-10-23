import { StarFilledIcon, StarOutlineIcon } from './icons';

/** Deretan bintang rating (bulat ke bawah), dengan teks alternatif "Rating 4 dari 5". */
export default function RatingStars({ value, max = 5, size = 18 }) {
  const filled = Math.floor(value);
  return (
    <span className="rating-stars" role="img" aria-label={`Rating ${value} dari ${max}`}>
      {Array.from({ length: max }, (_, i) =>
        i < filled ? (
          <StarFilledIcon key={i} size={size} className="rating-stars__on" />
        ) : (
          <StarOutlineIcon key={i} size={size} strokeWidth={1.75} className="rating-stars__off" />
        ),
      )}
    </span>
  );
}
