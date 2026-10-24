import { Link } from 'react-router';
import mapLayer1 from '@/assets/home/map-layer-1.svg';
import mapLayer2 from '@/assets/home/map-layer-2.svg';
import mapLayer3 from '@/assets/home/map-layer-3.svg';
import mapMarker from '@/assets/home/map-marker.svg';
import mapMarkerDot from '@/assets/home/map-marker-dot.svg';
import labelBekasi from '@/assets/home/map-label-bekasi.svg';
import labelKarawang from '@/assets/home/map-label-karawang.svg';
import labelBogor from '@/assets/home/map-label-bogor.svg';
import labelCirebon from '@/assets/home/map-label-cirebon.svg';
import labelBandung from '@/assets/home/map-label-bandung.svg';
import labelSukabumi from '@/assets/home/map-label-sukabumi.svg';
import labelTasikmalaya from '@/assets/home/map-label-tasikmalaya.svg';
import captionIcon from '@/assets/icons/map-caption.svg';
import statProvidersIcon from '@/assets/icons/stat-providers.svg';
import statCitiesIcon from '@/assets/icons/stat-cities.svg';
import statCategoriesIcon from '@/assets/icons/stat-categories.svg';
import arrowRight from '@/assets/icons/arrow-right.svg';
import InsetImage from '@/components/ui/InsetImage';
import { PATHS } from '@/routes/paths';
import SectionHeader from './SectionHeader';

const MARKER_BLEED = '-3.68% -5.21% -11.63% -5.21%';

/** Posisi titik layanan pada ilustrasi peta (persentase dari kotak peta, sesuai Figma). */
const MAP_POINTS = [
  {
    city: 'Bekasi',
    marker: '13.88% 70.56% 79.18% 25.7%',
    dot: '15.41% 71.73% 82.76% 26.87%',
    label: { src: labelBekasi, inset: '13.47% 75.55% 81.22% 13.86%', bleed: '-1.92% -0.74%' },
    text: '14.29% 77.26% 82.24% 15.58%',
  },
  {
    city: 'Karawang',
    marker: '16.73% 59.5% 76.33% 36.76%',
    dot: '18.27% 60.67% 79.9% 37.93%',
    label: { src: labelKarawang, inset: '16.33% 44.55% 78.37% 41.74%', bleed: '-1.92% -0.57%' },
    text: '17.14% 45.95% 79.39% 43.15%',
  },
  {
    city: 'Bogor',
    marker: '31.22% 78.04% 61.84% 18.22%',
    dot: '32.76% 79.21% 65.41% 19.39%',
    label: { src: labelBogor, inset: '30.82% 83.02% 63.88% 7.63%', bleed: '-1.92% -0.83%' },
    text: '31.63% 84.42% 64.9% 9.03%',
  },
  {
    city: 'Cirebon',
    marker: '36.73% 13.55% 56.33% 82.71%',
    dot: '38.27% 14.72% 59.9% 83.88%',
    label: { src: labelCirebon, inset: '36.33% 18.54% 58.37% 69.94%', bleed: '-1.92% -0.68%' },
    text: '37.14% 20.02% 59.39% 71.42%',
  },
  {
    city: 'Bandung',
    marker: '46.33% 48.13% 46.73% 48.13%',
    dot: '47.86% 49.3% 50.31% 49.3%',
    label: { src: labelBandung, inset: '45.92% 34.42% 48.78% 53.12%', bleed: '-1.92% -0.63%' },
    text: '46.73% 35.83% 49.8% 54.52%',
  },
  {
    city: 'Sukabumi',
    marker: '46.73% 73.21% 46.33% 23.05%',
    dot: '48.27% 74.38% 49.9% 24.22%',
    label: { src: labelSukabumi, inset: '55.31% 68.22% 39.39% 18.38%', bleed: '-1.92% -0.58%' },
    text: '56.12% 69.55% 40.41% 19.7%',
  },
  {
    city: 'Tasikmalaya',
    marker: '66.53% 25.7% 26.53% 70.56%',
    dot: '68.06% 26.87% 30.1% 71.73%',
    label: { src: labelTasikmalaya, inset: '66.12% 8.88% 28.57% 75.55%', bleed: '-1.92% -0.5%' },
    text: '66.94% 10.05% 29.59% 76.71%',
  },
];

const STATS = [
  { value: '100+', label: 'Penyedia layanan', icon: statProvidersIcon },
  { value: '7', label: 'Kota/kabupaten terjangkau', icon: statCitiesIcon },
  { value: '6', label: 'Kategori layanan', icon: statCategoriesIcon },
];

const mapAlt = `Peta Jawa Barat dengan titik layanan di ${MAP_POINTS.map((p) => p.city).join(', ')}`;

const PIN_PATH = 'M12 22 C11 19 5 15 5 10 A7 7 0 1 1 19 10 C19 15 13 19 12 22 Z';

function LegendPin({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={PIN_PATH} fill={color} />
      <circle cx="12" cy="10" r="2.6" fill="#fff" />
    </svg>
  );
}

/** Lokasi pengguna + radius ±5 km di atas ilustrasi peta (koordinat kotak 642×490). */
function UserLocationOverlay() {
  return (
    <svg
      className="service-map__overlay"
      viewBox="0 0 642 490"
      aria-hidden="true"
      focusable="false"
    >
      <circle
        cx="321"
        cy="262"
        r="74"
        fill="#14a3a3"
        fillOpacity="0.08"
        stroke="#0c7272"
        strokeWidth="2.5"
        strokeDasharray="7 7"
      />
      <g transform="translate(316 292)">
        <path
          d="M0 0 C-3 -8 -17 -16 -17 -32 A17 17 0 1 1 17 -32 C17 -16 3 -8 0 0 Z"
          fill="#0b3c6e"
          stroke="#fff"
          strokeWidth="3"
        />
        <circle cx="0" cy="-32" r="6" fill="#fff" />
        <rect x="-56" y="8" width="112" height="28" rx="9" fill="#0b3c6e" />
        <text
          x="0"
          y="27"
          textAnchor="middle"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
          fontSize="14"
          fontWeight="700"
          fill="#fff"
        >
          Lokasi Anda
        </text>
      </g>
    </svg>
  );
}

/**
 * Section 4. PETA SEBARAN. `userCity` (Beranda setelah masuk) menampilkan lokasi pengguna,
 * radius ±5 km, dan legenda.
 */
export default function ServiceMapSection({ userCity }) {
  const alt = userCity ? `${mapAlt}. Lokasi Anda: ${userCity}, dengan radius sekitar 5 km` : mapAlt;

  return (
    <section className="home-section" aria-labelledby="map-title">
      <div className="container service-map">
        <figure className="service-map__figure">
          <div className="service-map__canvas" role="img" aria-label={alt}>
            <InsetImage src={mapLayer1} inset="7.94% 4.47% 1.73% 5.59%" bleed="-1.13% -0.87%" />
            <InsetImage src={mapLayer2} inset="5.9% 5.4% 3.78% 4.66%" bleed="-1.13% -0.87%" />
            <InsetImage src={mapLayer3} inset="7.35% 7.17% 5.71% 6.39%" bleed="-0.18% -0.14%" />
            {MAP_POINTS.map((point) => (
              <span key={point.city} aria-hidden="true">
                <InsetImage src={mapMarker} inset={point.marker} bleed={MARKER_BLEED} />
                <InsetImage src={mapMarkerDot} inset={point.dot} />
                <InsetImage
                  src={point.label.src}
                  inset={point.label.inset}
                  bleed={point.label.bleed}
                />
                <span className="service-map__label" style={{ inset: point.text }}>
                  {point.city}
                </span>
              </span>
            ))}
            {userCity && <UserLocationOverlay />}
          </div>
          {userCity ? (
            <figcaption className="service-map__caption service-map__legend">
              <span>
                <LegendPin color="#14a3a3" />
                Penyedia layanan
              </span>
              <span>
                <LegendPin color="#0b3c6e" />
                Lokasi Anda
              </span>
              <span>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    fill="none"
                    stroke="#0c7272"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                </svg>
                Radius ±5 km
              </span>
            </figcaption>
          ) : (
            <figcaption className="service-map__caption">
              <img src={captionIcon} alt="" width="18" height="18" />
              Titik layanan aktif · ilustrasi peta disederhanakan
            </figcaption>
          )}
        </figure>

        <div className="service-map__info">
          <SectionHeader
            id="map-title"
            eyebrow="Jangkauan layanan"
            title="Peta Sebaran Layanan"
            description="Penyedia layanan tersebar di berbagai kota dan kabupaten di Jawa Barat. Temukan yang paling dekat dengan Anda."
          />
          <ul className="stat-list">
            {STATS.map((stat) => (
              <li key={stat.label} className="stat-list__item">
                <span className="stat-list__icon">
                  <img src={stat.icon} alt="" width="24" height="24" />
                </span>
                <span className="stat-list__text">
                  <strong className="stat-list__value">{stat.value}</strong>
                  <span className="stat-list__label">{stat.label}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link to={PATHS.map} className="link-arrow">
            Lihat Semua
            <span className="visually-hidden"> titik layanan di peta</span>
            <img src={arrowRight} alt="" width="20" height="20" />
          </Link>
        </div>
      </div>
    </section>
  );
}
