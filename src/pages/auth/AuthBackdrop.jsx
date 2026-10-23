/** Latar dekoratif panel kiri halaman auth: lingkaran jangkauan, garis Jawa Barat, dan pin. */
const OUTLINE =
  'M33.7 152.0 L69.2 135.4 L104.7 133.1 L133.1 130.7 L163.8 97.6 L175.6 57.3 L175.6 28.9 L211.1 33.7 L246.6 38.4 L275.0 64.4 L294.0 81.0 L329.5 92.8 L365.0 88.1 L400.5 97.6 L447.8 104.7 L483.3 97.6 L502.2 116.5 L530.6 159.1 L549.5 192.2 L577.9 211.1 L606.3 230.1 L596.9 270.3 L587.4 305.8 L601.6 341.3 L606.3 376.8 L592.1 419.4 L573.2 447.8 L530.6 466.7 L483.3 471.5 L436.0 466.7 L388.6 452.5 L329.5 428.9 L270.3 405.2 L211.1 388.6 L156.7 376.8 L104.7 372.1 L57.3 357.9 L38.4 317.6 L28.9 270.3 L33.7 223.0 L28.9 182.7 Z';

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
