import { useState } from 'react';
import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';
import { SAMPLE_CITY_STATS } from '@/features/providers/sampleProviders';
import { ArrowRightIcon, MinusIcon, PlusIcon, UsersIcon } from '@/components/ui/icons';
import { JABAR_BORDERS as BORDERS, JABAR_OUTLINE as OUTLINE } from '@/features/map/jabarOutline';

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
