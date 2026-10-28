import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  CrosshairIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  StarFilledIcon,
  XIcon,
} from '@/components/ui/icons';
import {
  CATEGORY_COLORS,
  DENSITY_LEVELS,
  PROVINCE_OUTLINE,
  densityLevel,
  shapeCenter,
} from '@/features/pengelola/pengelolaData';
import { formatScore } from '@/features/pengelola/pengelolaFormat';
import { PATHS, buildAdminPath, buildAlumniPath } from '@/routes/paths';
import { Avatar, CategoryIcon } from '../admin/AdminParts';

const BASE = { x: -40, y: -30, w: 720, h: 560 };
const ZOOMS = [1, 1.5, 2, 3];

const onActivate = (fn) => (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    fn();
  }
};

function FullscreenIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function Pin({ color }) {
  return (
    <g>
      <path
        d="M0 0 C-3 -9 -15 -18 -15 -31 A15 15 0 1 1 15 -31 C15 -18 3 -9 0 0 Z"
        fill="#14a3a3"
        stroke="#fff"
        strokeWidth="2.5"
      />
      <circle cx="0" cy="-31" r="7.5" fill="#fff" />
      <circle cx="0" cy="-31" r="4.5" fill={color} />
    </g>
  );
}

/**
 * Peta ilustrasi sebaran Jawa Barat (SVG, bisa diperbesar). Lapisan "titik" =
 * kelompok penyedia per wilayah + pin penyedia; "densitas" = choropleth pesanan.
 * `selection` = { type: 'region' | 'alumni', id }.
 */
export default function RegionMap({
  layer,
  regions,
  clusters,
  pins,
  categories,
  dimmed,
  selection,
  onSelect,
  focusRequest,
}) {
  const wrapRef = useRef(null);
  const nodeRefs = useRef({});
  const [zoom, setZoom] = useState(0);
  const [center, setCenter] = useState([BASE.x + BASE.w / 2, BASE.y + BASE.h / 2]);

  const scale = ZOOMS[zoom];
  const view = {
    w: BASE.w / scale,
    h: BASE.h / scale,
  };
  view.x = Math.min(Math.max(center[0] - view.w / 2, BASE.x), BASE.x + BASE.w - view.w);
  view.y = Math.min(Math.max(center[1] - view.h / 2, BASE.y), BASE.y + BASE.h - view.h);

  // Escape menutup info penyedia/wilayah yang sedang terbuka.
  useEffect(() => {
    if (!selection) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !document.querySelector('dialog[open]')) onSelect(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [selection, onSelect]);

  const regionById = (id) => regions.find((r) => r.id === id);
  const categoryOf = (id) => categories.find((c) => c.id === id);

  // "Fokus di peta" dari tabel: perbesar ke wilayah lalu fokuskan elemennya.
  useEffect(() => {
    if (!focusRequest) return;
    const region = regionById(focusRequest.id);
    if (!region) return;
    setCenter(shapeCenter(region.shape));
    setZoom((z) => Math.max(z, 1));
    wrapRef.current?.scrollIntoView?.({ block: 'center' });
    requestAnimationFrame(() => nodeRefs.current[`region-${region.id}`]?.focus());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  const reset = () => {
    setZoom(0);
    setCenter([BASE.x + BASE.w / 2, BASE.y + BASE.h / 2]);
    onSelect(null);
  };

  const fullscreen = () => {
    const node = wrapRef.current;
    if (!node?.requestFullscreen) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else node.requestFullscreen();
  };

  // Posisi popup (persen terhadap wadah) dari koordinat SVG.
  let popup = null;
  if (selection?.type === 'region') {
    const region = regionById(selection.id);
    if (region) popup = { kind: 'region', region, at: shapeCenter(region.shape) };
  } else if (selection?.type === 'alumni') {
    const pin = pins.find((p) => p.alumni.id === selection.id);
    if (pin) popup = { kind: 'alumni', ...pin, at: [pin.x, pin.y - 34] };
  }
  // Dijepit agar kartu tidak terpotong tepi peta; di bagian atas peta kartu tampil di bawah titik.
  const popupLeft = popup && ((popup.at[0] - view.x) / view.w) * 100;
  const popupTop = popup && ((popup.at[1] - view.y) / view.h) * 100;
  const popupStyle = popup && {
    left: `${Math.min(Math.max(popupLeft, 22), 78)}%`,
    top: `${Math.min(Math.max(popupTop, 4), 96)}%`,
  };

  return (
    <div
      ref={wrapRef}
      className="pg-map"
      role="region"
      aria-label="Peta sebaran penyedia di Jawa Barat (OpenStreetMap). Alternatif teks tersedia di tabel Sebaran per Kota/Kabupaten."
    >
      <svg
        className="pg-map__svg"
        viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect
          x={BASE.x - 200}
          y={BASE.y - 200}
          width={BASE.w + 400}
          height={BASE.h + 400}
          fill="#dceaf4"
        />
        <path
          d="M-60 120 L33 152 L28.9 182.7 L33.7 223 L28.9 270.3 L38.4 317.6 L57.3 357.9 L-60 380 Z"
          fill="#eef1f4"
        />
        <path
          d="M606.3 230.1 L700 200 L700 470 L592.1 419.4 L606.3 376.8 L601.6 341.3 L587.4 305.8 L596.9 270.3 Z"
          fill="#eef1f4"
        />
        <g className="pg-map__sea" aria-hidden="true">
          <text x="290" y="10" textAnchor="middle">
            Laut Jawa
          </text>
          <text x="300" y="515" textAnchor="middle">
            Samudra Hindia
          </text>
          <text x="-20" y="250" className="pg-map__neighbor">
            BANTEN
          </text>
          <text x="625" y="330" className="pg-map__neighbor">
            JATENG
          </text>
        </g>
        <path d={PROVINCE_OUTLINE} fill="#fbfcfd" />

        {regions.map((region) => {
          const level = DENSITY_LEVELS[densityLevel(region.orders)];
          const selected = selection?.type === 'region' && selection.id === region.id;
          const fill = layer === 'densitas' ? level.color : '#fbfcfd';
          return (
            <path
              key={region.id}
              ref={(node) => {
                nodeRefs.current[`region-${region.id}`] = node;
              }}
              d={region.shape}
              className={`pg-map__region${dimmed?.has(region.id) ? ' is-dimmed' : ''}${selected ? ' is-selected' : ''}`}
              fill={fill}
              stroke={layer === 'densitas' ? '#fff' : '#d3dce4'}
              strokeWidth={layer === 'densitas' ? 2 : 1.5}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${region.name}: ${region.providers} penyedia, ${region.orders} pesanan`}
              onClick={() => onSelect(selected ? null : { type: 'region', id: region.id })}
              onKeyDown={onActivate(() =>
                onSelect(selected ? null : { type: 'region', id: region.id }),
              )}
            />
          );
        })}
        <path
          d={PROVINCE_OUTLINE}
          fill="none"
          stroke="#7e9ab0"
          strokeWidth="2.5"
          pointerEvents="none"
        />
        {selection?.type === 'region' && regionById(selection.id) && (
          <path
            d={regionById(selection.id).shape}
            fill="none"
            stroke="#14a3a3"
            strokeWidth="4"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}

        <g className="pg-map__labels" aria-hidden="true">
          {regions
            .filter((r) => r.label)
            .map((region) => {
              const [x, y] = shapeCenter(region.shape);
              const dark = layer === 'densitas' && densityLevel(region.orders) >= 3;
              return (
                <text
                  key={region.id}
                  x={x}
                  y={layer === 'titik' ? y + 30 : y + 4}
                  textAnchor="middle"
                  className={dark ? 'is-dark' : undefined}
                >
                  {region.label}
                </text>
              );
            })}
        </g>

        {layer === 'titik' && (
          <g>
            {pins.map((pin) => {
              const selected = selection?.type === 'alumni' && selection.id === pin.alumni.id;
              return (
                <g
                  key={pin.alumni.id}
                  className={`pg-map__pin${selected ? ' is-selected' : ''}`}
                  transform={`translate(${pin.x} ${pin.y})`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${pin.alumni.name}, ${categoryOf(pin.alumni.category)?.name ?? ''}`}
                  onClick={() => onSelect(selected ? null : { type: 'alumni', id: pin.alumni.id })}
                  onKeyDown={onActivate(() =>
                    onSelect(selected ? null : { type: 'alumni', id: pin.alumni.id }),
                  )}
                >
                  <Pin color={CATEGORY_COLORS[pin.alumni.category]} />
                </g>
              );
            })}
            {clusters.map(({ region, count }) => {
              const [x, y] = shapeCenter(region.shape);
              const radius = count >= 30 ? 27 : count >= 10 ? 22 : 18;
              const selected = selection?.type === 'region' && selection.id === region.id;
              return (
                <g
                  key={region.id}
                  className={`pg-map__cluster${selected ? ' is-selected' : ''}`}
                  transform={`translate(${x} ${y})`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${count} penyedia di ${region.name}, pilih untuk melihat ringkasan`}
                  onClick={() => onSelect(selected ? null : { type: 'region', id: region.id })}
                  onKeyDown={onActivate(() =>
                    onSelect(selected ? null : { type: 'region', id: region.id }),
                  )}
                >
                  <circle r={radius + 5} fill="#0b3c6e" fillOpacity="0.22" />
                  <circle r={radius} fill="#0b3c6e" stroke="#fff" strokeWidth="3" />
                  <text y="5" textAnchor="middle">
                    {count}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {popup && (
        <div
          className={`pg-map__popup${popupTop < 38 ? ' is-below' : ''}`}
          style={popupStyle}
          role="dialog"
          aria-label={
            popup.kind === 'region'
              ? `Info wilayah ${popup.region.name}`
              : `Info penyedia ${popup.alumni.name}`
          }
        >
          {popup.kind === 'region' ? (
            <>
              <div className="pg-map__popup-head">
                <span className="pg-map__popup-title">
                  <strong>{popup.region.name}</strong>
                  <span>
                    {popup.region.top
                      ? `Terbanyak: ${categoryOf(popup.region.top)?.name}`
                      : 'Belum terjangkau'}
                  </span>
                </span>
                <button type="button" aria-label="Tutup info (Esc)" onClick={() => onSelect(null)}>
                  <XIcon size={18} strokeWidth={2} />
                </button>
              </div>
              <p className="pg-map__popup-meta">
                {popup.region.providers} penyedia · {popup.region.services} layanan ·{' '}
                {popup.region.orders} pesanan
              </p>
              {popup.region.providers > 0 && (
                <Link
                  to={buildAdminPath(PATHS.pengelolaAlumni, { kota: popup.region.name })}
                  className="pg-map__popup-link"
                >
                  Lihat Data Alumni →
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="pg-map__popup-head">
                <Avatar person={popup.alumni} size={40} />
                <span className="pg-map__popup-title">
                  <strong>{popup.alumni.name}</strong>
                  <span>
                    <CategoryIcon icon={categoryOf(popup.alumni.category)?.icon} size={14} />
                    {categoryOf(popup.alumni.category)?.name}
                  </span>
                </span>
                <button type="button" aria-label="Tutup info (Esc)" onClick={() => onSelect(null)}>
                  <XIcon size={18} strokeWidth={2} />
                </button>
              </div>
              <p className="pg-map__popup-meta">
                {popup.alumni.rating != null && (
                  <span>
                    <StarFilledIcon size={14} aria-hidden="true" className="pg-star" />
                    <strong>{formatScore(popup.alumni.rating)}</strong>
                  </span>
                )}
                <span>
                  <MapPinIcon size={14} aria-hidden="true" />
                  {popup.alumni.city}
                </span>
                <span>{popup.services} layanan</span>
              </p>
              <Link to={buildAlumniPath(popup.alumni.id)} className="pg-map__popup-link">
                Lihat detail →
              </Link>
            </>
          )}
        </div>
      )}

      <div className="pg-map__controls">
        <div className="pg-map__control-group">
          <button
            type="button"
            aria-label="Perbesar peta"
            title="Perbesar peta"
            disabled={zoom === ZOOMS.length - 1}
            onClick={() => setZoom((z) => Math.min(z + 1, ZOOMS.length - 1))}
          >
            <PlusIcon size={20} strokeWidth={2.25} />
          </button>
          <button
            type="button"
            aria-label="Perkecil peta"
            title="Perkecil peta"
            disabled={zoom === 0}
            onClick={() => setZoom((z) => Math.max(z - 1, 0))}
          >
            <MinusIcon size={20} strokeWidth={2.25} />
          </button>
        </div>
        <div className="pg-map__control-group">
          <button
            type="button"
            aria-label="Reset tampilan ke seluruh Jawa Barat"
            title="Reset tampilan ke seluruh Jawa Barat"
            onClick={reset}
          >
            <CrosshairIcon size={20} strokeWidth={2.25} />
          </button>
          <button type="button" aria-label="Layar penuh" title="Layar penuh" onClick={fullscreen}>
            <FullscreenIcon />
          </button>
        </div>
      </div>

      <div className="pg-map__legend" role="note" aria-label="Legenda peta">
        {layer === 'densitas' ? (
          <>
            <span className="pg-map__legend-title">Kepadatan pesanan · 2026</span>
            <span className="pg-map__scale" aria-hidden="true">
              {DENSITY_LEVELS.map((level) => (
                <span key={level.label} style={{ background: level.color }} />
              ))}
            </span>
            <span className="pg-map__scale-labels">
              {DENSITY_LEVELS.map((level) => (
                <span key={level.label}>{level.label}</span>
              ))}
            </span>
          </>
        ) : (
          <>
            <span className="pg-map__legend-row">
              <span className="pg-map__legend-pin" aria-hidden="true" />1 penyedia
              <span className="pg-map__legend-cluster" aria-hidden="true">
                9
              </span>
              Kelompok
            </span>
            <span className="pg-map__legend-title">Titik tengah = kategori</span>
            <ul className="pg-map__legend-cats">
              {categories
                .filter((c) => c.id !== 'kerajinan')
                .map((c) => (
                  <li key={c.id}>
                    <span style={{ background: CATEGORY_COLORS[c.id] }} aria-hidden="true" />
                    {c.name}
                  </li>
                ))}
            </ul>
          </>
        )}
      </div>

      <div className="pg-map__attribution">
        ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>{' '}
        contributors
      </div>
    </div>
  );
}
