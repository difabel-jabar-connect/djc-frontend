import starVector from '@/assets/icons/star-vector.svg';
import InsetImage from './InsetImage';

/** Ikon bintang rating 16×16 (Figma: SVG/Vector). */
export default function StarIcon() {
  return (
    <span className="icon-box icon-box--16" aria-hidden="true">
      <InsetImage src={starVector} inset="8.33% 8.33% 12.42% 8.33%" bleed="-3.94% -3.75%" />
    </span>
  );
}
