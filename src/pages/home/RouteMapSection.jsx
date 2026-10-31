import { useState } from 'react';
import { CalendarIcon, CheckCircleIcon, CheckIcon, SearchIcon } from '@/components/ui/icons';
import SectionHeader from './SectionHeader';

const STEPS = [
  {
    title: 'Cari Layanan',
    description: 'Temukan layanan berdasarkan kategori, lokasi, atau nama penyedia.',
    icon: SearchIcon,
    // Posisi kartu & penanda pada ilustrasi (koordinat kanvas 792×440, sesuai desain).
    card: { left: 70, top: 207, arrow: 'bottom' },
    marker: { left: 146, top: 271 },
  },
  {
    title: 'Pesan Layanan',
    description: 'Pilih paket dan jadwal, lalu kirim pesanan ke penyedia.',
    icon: CalendarIcon,
    card: { left: 312, top: 312, arrow: 'top' },
    marker: { left: 388, top: 256 },
  },
  {
    title: 'Gunakan Layanan',
    description: 'Nikmati layanan berkualitas dari alumni difabel Jawa Barat.',
    icon: CheckCircleIcon,
    card: { left: 532, top: 64, arrow: 'bottom' },
    marker: { left: 608, top: 128 },
  },
];

const ROUTE_PATH =
  'M-30 383.9 L-10 393.1 L10 399.8 L30 402.3 L50 399.4 L70 390.6 L90 376.1 L110 357 L130 335.1 L150 312.3 L170 290.9 L190 272.9 L210 259.7 L230 252.3 L250 250.8 L270 254.6 L290 262.1 L310 271.5 L330 280.6 L350 287.3 L370 289.8 L390 286.9 L410 278.1 L430 263.6 L450 244.6 L470 222.6 L490 199.9 L510 178.4 L530 160.4 L550 147.2 L570 139.9 L590 138.4 L610 142.1 L630 149.6 L650 159 L670 168.1 L690 174.8 L710 177.4 L730 174.5 L750 165.6';

const pos = ({ left, top }) => ({ '--x': left, '--y': top });

function RouteIllustration({ highlighted }) {
  return (
    <div
      id="rute-peta"
      className="route-map"
      role="img"
      aria-label="Ilustrasi rute: Mulai, 01 Cari Layanan, 02 Pesan Layanan, 03 Gunakan Layanan, lalu Layanan selesai."
    >
      <svg className="route-map__bg" viewBox="0 0 792 440" aria-hidden="true" focusable="false">
        <g fill="none" stroke="#e8f3fa" strokeWidth="1.6">
          {[40, 92, 150, 214, 280, 346, 410].map((y) => (
            <path
              key={y}
              d={`M-20 ${y} C 160 ${y - 40} 300 ${y + 50} 460 ${y + 6} S 700 ${y - 46} 820 ${y - 10}`}
            />
          ))}
          <circle cx="610" cy="330" r="28" />
          <circle cx="610" cy="330" r="52" />
          <circle cx="610" cy="330" r="76" />
        </g>
        <g fill="#cfe3f1">
          {[60, 80, 100].flatMap((x) =>
            [60, 80].map((y) => <circle key={`a${x}${y}`} cx={x} cy={y} r="3" />),
          )}
          {[700, 720, 740].flatMap((x) =>
            [380, 400].map((y) => <circle key={`b${x}${y}`} cx={x} cy={y} r="3" />),
          )}
        </g>
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="#0b3c6e"
          strokeOpacity="0.1"
          strokeWidth="56"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0 12)"
        />
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="#0b3c6e"
          strokeWidth="48"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={ROUTE_PATH}
          fill="none"
          stroke="#14a3a3"
          strokeWidth="3"
          strokeDasharray="14 12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <span className="route-map__start" style={pos({ left: 31, top: 393 })} />
      <span className="route-map__start-label" style={pos({ left: 56, top: 389 })}>
        Mulai
      </span>

      {STEPS.map((step, index) => {
        const Icon = step.icon;
        const active = highlighted === index;
        return (
          <span key={step.title}>
            <span
              className={`route-map__card route-map__card--${step.card.arrow}${active ? ' is-active' : ''}`}
              style={pos(step.card)}
            >
              <span className="route-map__card-icon">
                <Icon size={18} strokeWidth={2.25} />
              </span>
              {step.title}
            </span>
            <span
              className={`route-map__marker${active ? ' is-active' : ''}`}
              style={pos(step.marker)}
            >
              {String(index + 1).padStart(2, '0')}
            </span>
          </span>
        );
      })}

      <svg
        className="route-map__finish"
        style={pos({ left: 714, top: 100 })}
        viewBox="0 0 56 70"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M28 68 C25 60 4 44 4 26 A24 24 0 1 1 52 26 C52 44 31 60 28 68 Z"
          fill="#14a3a3"
          stroke="#fff"
          strokeWidth="3"
        />
        <circle cx="28" cy="26" r="11" fill="#fff" />
        <path
          d="m22 26 4.5 4.5 8-8.5"
          fill="none"
          stroke="#0c7272"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="route-map__done" style={pos({ left: 592, top: 210 })}>
        Layanan selesai
        <CheckIcon size={16} strokeWidth={3} />
      </span>
    </div>
  );
}

/**
 * Section 5. CARA MENGGUNAKAN · PETA RUTE — kartu langkah menyorot titik pada ilustrasi
 * saat diarahkan/difokus; klik menyematkan sorotan (aria-pressed).
 */
export default function RouteMapSection() {
  const [hovered, setHovered] = useState(null);
  const [pinned, setPinned] = useState(null);
  const highlighted = hovered ?? pinned;

  return (
    <section className="home-section home-section--tinted" aria-labelledby="steps-title">
      <div className="container">
        <SectionHeader
          id="steps-title"
          eyebrow="Cara menggunakan"
          title="Rute Mudah Menggunakan Layanan"
          description="Dari mencari hingga menikmati layanan, semuanya bisa dilakukan dari satu tempat."
        />
        <div className="route">
          <ol className="route__steps" aria-label="Langkah menggunakan layanan">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title}>
                  <button
                    type="button"
                    className={`route__card${highlighted === index ? ' is-active' : ''}`}
                    aria-pressed={pinned === index}
                    aria-controls="rute-peta"
                    onClick={() => setPinned((current) => (current === index ? null : index))}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                  >
                    <span className="route__card-icon" aria-hidden="true">
                      <Icon size={24} />
                    </span>
                    <span className="route__card-text">
                      <span className="route__card-step">Langkah {index + 1}</span>
                      <span className="route__card-title">{step.title}</span>
                      <span className="route__card-desc">{step.description}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <RouteIllustration highlighted={highlighted} />
        </div>
      </div>
    </section>
  );
}
