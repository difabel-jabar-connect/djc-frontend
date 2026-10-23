import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';
import { SAMPLE_CITY_STATS } from '@/features/providers/sampleProviders';
import { ArrowRightIcon, MinusIcon, PlusIcon, UsersIcon } from '@/components/ui/icons';

/** Garis besar Jawa Barat (ilustrasi disederhanakan, viewBox 640×490). */
const OUTLINE =
  'M33.7 152.0 L69.2 135.4 L104.7 133.1 L133.1 130.7 L163.8 97.6 L175.6 57.3 L175.6 28.9 L211.1 33.7 L246.6 38.4 L275.0 64.4 L294.0 81.0 L329.5 92.8 L365.0 88.1 L400.5 97.6 L447.8 104.7 L483.3 97.6 L502.2 116.5 L530.6 159.1 L549.5 192.2 L577.9 211.1 L606.3 230.1 L596.9 270.3 L587.4 305.8 L601.6 341.3 L606.3 376.8 L592.1 419.4 L573.2 447.8 L530.6 466.7 L483.3 471.5 L436.0 466.7 L388.6 452.5 L329.5 428.9 L270.3 405.2 L211.1 388.6 L156.7 376.8 L104.7 372.1 L57.3 357.9 L38.4 317.6 L28.9 270.3 L33.7 223.0 L28.9 182.7 Z';

const BORDERS = [
  'M140 132 C150 190 120 250 150 330',
  'M230 36 C240 120 220 200 250 260 C270 320 260 360 270 400',
  'M380 92 C400 170 380 250 420 320 C440 380 430 420 440 462',
  'M500 118 C520 200 540 260 590 300',
];

/** Posisi penanda kota pada ilustrasi. */
const CITY_POSITIONS = {
  Bekasi: [176, 102],
  Karawang: [250, 128],
  Bogor: [120, 190],
  Sukabumi: [165, 272],
  Bandung: [320, 261],
  Cirebon: [540, 214],
  Tasikmalaya: [464, 360],
};

const ZOOM = { min: 1, max: 2, step: 0.25 };

/** Kartu "Sebaran Layanan di Jawa Barat" di sidebar. */
export default function DistributionMapCard({ stats = SAMPLE_CITY_STATS }) {
  const [zoom, setZoom] = useState(ZOOM.min);
  const total = stats.reduce((sum, item) => sum + item.count, 0);
  const totalLabel = total >= 100 ? `${Math.floor(total / 100) * 100}+` : String(total);
  const maxCount = Math.max(...stats.map((item) => item.count));
  const mapLabel = `Peta jumlah penyedia: ${stats.map((s) => `${s.city} ${s.count}`).join(', ')}`;

  return (
    <section className="side-card" aria-labelledby="peta-title">
      <div className="side-card__head">
        <h2 id="peta-title" className="side-card__title">
          Sebaran Layanan di Jawa Barat
        </h2>
        <span className="pill">
          <UsersIcon size={16} />
          {totalLabel} Penyedia Layanan
        </span>
      </div>

      <div className="mini-map">
        <div className="mini-map__viewport">
          <svg
            className="mini-map__svg"
            viewBox="0 0 640 490"
            role="img"
            aria-label={mapLabel}
            style={{ transform: `scale(${zoom})` }}
          >
            <path
              d={OUTLINE}
              transform="translate(6 10)"
              fill="#c9e3f2"
              stroke="#c9e3f2"
              strokeWidth="10"
              strokeLinejoin="round"
            />
            <path d={OUTLINE} fill="#fff" stroke="#fff" strokeWidth="10" strokeLinejoin="round" />
            <g
              fill="none"
              stroke="#b6d4e8"
              strokeWidth="2.5"
              strokeDasharray="8 9"
              strokeLinecap="round"
            >
              {BORDERS.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g className="mini-map__markers" textAnchor="middle">
              {stats
                .filter((item) => CITY_POSITIONS[item.city])
                .map((item) => {
                  const [x, y] = CITY_POSITIONS[item.city];
                  const big = item.count === maxCount;
                  return (
                    <g key={item.city} transform={`translate(${x} ${y})`}>
                      <circle r={big ? 40 : 34} fill="#14a3a3" opacity="0.25" />
                      <circle r={big ? 30 : 25} fill="#0b3c6e" stroke="#fff" strokeWidth="4" />
                      <text y="9">{item.count}</text>
                    </g>
                  );
                })}
            </g>
          </svg>
        </div>
        <div className="mini-map__zoom">
          <button
            type="button"
            aria-label="Perbesar peta"
            onClick={() => setZoom((z) => Math.min(ZOOM.max, z + ZOOM.step))}
            disabled={zoom >= ZOOM.max}
          >
            <PlusIcon />
          </button>
          <button
            type="button"
            aria-label="Perkecil peta"
            onClick={() => setZoom((z) => Math.max(ZOOM.min, z - ZOOM.step))}
            disabled={zoom <= ZOOM.min}
          >
            <MinusIcon />
          </button>
        </div>
      </div>

      <ul className="city-counts" aria-label="Jumlah penyedia per kota">
        {stats.map((item) => (
          <li key={item.city}>
            <span className="city-counts__badge">{item.count}</span>
            {item.city}
          </li>
        ))}
      </ul>

      <Link to={PATHS.map} className="link-arrow">
        Lihat Daftar
        <span className="visually-hidden"> sebaran di peta</span>
        <ArrowRightIcon />
      </Link>
    </section>
  );
}
