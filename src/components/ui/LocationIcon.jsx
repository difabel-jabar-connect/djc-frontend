import pinOuter from '@/assets/icons/pin-outer.svg';
import pinInner from '@/assets/icons/pin-inner.svg';
import InsetImage from './InsetImage';

/** Ikon pin lokasi 20×20 (Figma: SVG/Vector ×2). */
export default function LocationIcon() {
  return (
    <span className="icon-box icon-box--20" aria-hidden="true">
      <InsetImage src={pinOuter} inset="8.33% 16.67%" bleed="-5% -6.25%" />
      <InsetImage src={pinInner} inset="29.17% 37.5% 45.83% 37.5%" bleed="-16.67%" />
    </span>
  );
}
