import { JABAR_OUTLINE as OUTLINE } from '@/features/map/jabarOutline';

const RINGS = [
  { r: 90, opacity: 0.12 },
  { r: 180, opacity: 0.1 },
  { r: 280, opacity: 0.08, dashed: true },
  { r: 390, opacity: 0.07 },
  { r: 510, opacity: 0.06, dashed: true },
];

const SMALL_PIN = 'M0 0 C-2 -5 -10 -9 -10 -18 A10 10 0 1 1 10 -18 C10 -9 2 -5 0 0 Z';
const SMALL_PINS = [
  [410, 330],
  [640, 360],
  [600, 600],
  [450, 560],
  [690, 500],
];

/** Latar dekoratif panel kiri halaman auth: lingkaran jangkauan, garis Jawa Barat, dan pin. */
export default function AuthBackdrop() {
  return (
    <svg
      className="auth-intro__backdrop"
      viewBox="0 0 720 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="#fff" strokeWidth="2">
        {RINGS.map(({ r, opacity, dashed }) => (
          <circle
            key={r}
            cx="520"
            cy="450"
            r={r}
            strokeOpacity={opacity}
            strokeDasharray={dashed ? '6 10' : undefined}
          />
        ))}
      </g>
      <circle cx="520" cy="450" r="90" fill="#fff" fillOpacity="0.05" />
      <path
        d={OUTLINE}
        transform="translate(250 230) scale(0.9)"
        fill="#fff"
        fillOpacity="0.04"
        stroke="#fff"
        strokeOpacity="0.14"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <g transform="translate(520 450)">
        <path
          d="M0 0 C-2 -6 -14 -13 -14 -26 A14 14 0 1 1 14 -26 C14 -13 2 -6 0 0 Z"
          fill="#fff"
          fillOpacity="0.9"
        />
        <circle cx="0" cy="-26" r="5" fill="#0c7272" />
      </g>
      <g fill="#fff" fillOpacity="0.28">
        {SMALL_PINS.map(([x, y]) => (
          <path key={`${x}-${y}`} d={SMALL_PIN} transform={`translate(${x} ${y})`} />
        ))}
      </g>
    </svg>
  );
}
