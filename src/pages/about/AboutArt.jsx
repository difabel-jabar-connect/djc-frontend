import { JABAR_BORDERS, JABAR_OUTLINE } from '@/features/map/jabarOutline';

/** Garis batas tambahan (horizontal) yang dipakai ilustrasi halaman Tentang. */
const BORDERS = [...JABAR_BORDERS, 'M40 250 C120 240 200 250 300 240 C400 230 480 260 595 250'];
const PIN_PATH = 'M0 0 C-2 -6 -12 -12 -12 -22 A12 12 0 1 1 12 -22 C12 -12 2 -6 0 0 Z';

function Pin({ x, y, scale = 1.15 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d={PIN_PATH} fill="#14a3a3" stroke="#fff" strokeWidth="2.5" />
      <circle cx="0" cy="-22" r="4.5" fill="#fff" />
    </g>
  );
}

function JabarMap({ fill = '#e8f3fa', outline = false }) {
  return (
    <>
      <path
        d={JABAR_OUTLINE}
        transform="translate(6 10)"
        fill="#c9e3f2"
        stroke="#c9e3f2"
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path d={JABAR_OUTLINE} fill={fill} stroke={fill} strokeWidth="10" strokeLinejoin="round" />
      {outline && <path d={JABAR_OUTLINE} fill="none" stroke="#b6d4e8" strokeWidth="2" />}
      <g fill="none" stroke="#b6d4e8" strokeWidth="1.5" strokeDasharray="5 6" strokeLinecap="round">
        {BORDERS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </>
  );
}

/* Ikon keahlian dalam gelembung (ilustrasi hero). */
const SKILLS = [
  {
    x: 70,
    y: 40,
    paths: ['M8.12 8.12 12 12', 'M20 4 8.12 15.88', 'M14.8 14.8 20 20'],
    circles: [
      [6, 6],
      [6, 18],
    ],
  },
  {
    x: 600,
    y: 70,
    paths: [
      'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    ],
  },
  {
    x: 610,
    y: 440,
    paths: [
      'm14.622 17.897-10.68-2.913',
      'M18.376 2.622a1 1 0 1 1 3.002 3.002L17.36 9.643a.5.5 0 0 0 0 .707l.944.944a2.41 2.41 0 0 1 0 3.408l-.944.944a.5.5 0 0 1-.707 0L8.354 7.348a.5.5 0 0 1 0-.707l.944-.944a2.41 2.41 0 0 1 3.408 0l.944.944a.5.5 0 0 0 .707 0z',
      'M9 8c-1.804 2.71-3.97 3.46-6.583 3.948a.507.507 0 0 0-.302.819l7.32 8.883a1 1 0 0 0 1.185.204C12.735 20.405 16 16.792 16 15',
    ],
  },
  {
    x: 50,
    y: 450,
    paths: [
      'm13 11 9-9',
      'M14.6 12.6c.8.8.9 2.1.2 3L10 22l-8-8 6.4-4.8c.9-.7 2.2-.6 3 .2Z',
      'm6.8 10.4 6.8 6.8',
      'm5 17 1.4-1.4',
    ],
  },
];

const HERO_PINS = [
  { x: 176, y: 102, curve: 'M176 80 Q 123 0 70 40' },
  { x: 320, y: 261, curve: 'M320 239 Q 460 30 600 70' },
  { x: 542, y: 214, curve: 'M542 192 Q 576 174 610 440' },
  { x: 464, y: 360, curve: 'M464 338 Q 257 320 50 450' },
];

/** Ilustrasi hero Tentang: peta Jawa Barat, titik penyedia, dan keahlian alumni. */
export function AboutHeroArt() {
  return (
    <svg className="about-hero__art" viewBox="-10 -10 680 510" aria-hidden="true" focusable="false">
      <circle
        cx="320"
        cy="250"
        r="236"
        fill="none"
        stroke="#c9e3f2"
        strokeWidth="2"
        strokeDasharray="8 9"
      />
      <g fill="#cfe3f1">
        {[560, 578, 596, 614, 632].flatMap((x) =>
          [170, 188, 206].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />),
        )}
      </g>
      <g transform="translate(40 40) scale(0.88)">
        <JabarMap outline />
      </g>
      <g transform="translate(40 40) scale(0.88)">
        {HERO_PINS.map((pin) => (
          <path
            key={pin.curve}
            d={pin.curve}
            fill="none"
            stroke="#14a3a3"
            strokeWidth="2.5"
            strokeDasharray="6 7"
            strokeLinecap="round"
          />
        ))}
        {HERO_PINS.map((pin) => (
          <Pin key={`${pin.x}-${pin.y}`} x={pin.x} y={pin.y} scale={1.25} />
        ))}
      </g>
      {SKILLS.map((skill) => (
        <g key={`${skill.x}-${skill.y}`}>
          <circle cx={skill.x} cy={skill.y} r="38" fill="#fff" stroke="#e5e7eb" strokeWidth="1.5" />
          <circle cx={skill.x} cy={skill.y} r="28" fill="#e3f6f6" />
          <g
            transform={`translate(${skill.x - 14} ${skill.y - 14}) scale(1.167)`}
            fill="none"
            stroke="#0c7272"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {skill.circles?.map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />
            ))}
            {skill.paths.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
      ))}
      <path d="M640 330 l3 10 10 3 -10 3 -3 10 -3 -10 -10 -3 10 -3 Z" fill="#14a3a3" />
      <path d="M10 250 l2 7 7 2 -7 2 -2 7 -2 -7 -7 -2 7 -2 Z" fill="#14a3a3" opacity="0.7" />
    </svg>
  );
}

const MAP_POINTS = [
  { name: 'Bekasi', x: 176, y: 102, label: [92, 62, 66] },
  { name: 'Bogor', x: 128, y: 187, label: [53, 147, 57] },
  { name: 'Cimahi', x: 268, y: 236, label: [184, 196, 66] },
  { name: 'Bandung', x: 320, y: 261, label: [338, 221, 74] },
  { name: 'Cirebon', x: 542, y: 214, label: [450, 174, 74] },
  { name: 'Tasikmalaya', x: 464, y: 360, label: [482, 320, 109] },
];

/** Peta sebaran penyedia (ilustrasi bagian "Peta layanan"). */
export function AboutServiceMap() {
  return (
    <svg className="about-map__svg" viewBox="0 0 640 490" aria-hidden="true" focusable="false">
      <JabarMap />
      {MAP_POINTS.map(({ name, x, y, label: [lx, ly, lw] }) => (
        <g key={name}>
          <Pin x={x} y={y} />
          <rect x={lx} y={ly} width={lw} height="26" rx="8" fill="#fff" stroke="#b6d4e8" />
          <text
            x={lx + lw / 2}
            y={ly + 18}
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
            fontSize="14"
            fontWeight="700"
            fill="#0b3c6e"
          >
            {name}
          </text>
        </g>
      ))}
    </svg>
  );
}
