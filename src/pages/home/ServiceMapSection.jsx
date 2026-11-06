import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import { JABAR_BOUNDS, inArea } from '@/features/map/jabarGeo';
import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import { useInViewClass } from '@/hooks/useInViewClass';
import { PATHS } from '@/routes/paths';

// Leaflet cukup besar: dimuat terpisah saat Beranda dibuka.
const ProviderMap = lazy(() => import('@/pages/services/ProviderMap'));

const REGIONS = [
  { id: 'jabar', label: 'Seluruh Jabar', name: 'seluruh Jawa Barat', bounds: JABAR_BOUNDS },
  {
    id: 'bandung',
    label: 'Bandung Raya',
    name: 'Bandung Raya',
    bounds: [
      [-7.2, 107.3],
      [-6.7, 108.0],
    ],
  },
  {
    id: 'bodebek',
    label: 'Bogor–Bekasi',
    name: 'Bogor, Depok, dan Bekasi',
    bounds: [
      [-6.8, 106.55],
      [-6.1, 107.35],
    ],
  },
  {
    id: 'priangan',
    label: 'Priangan Timur',
    name: 'Priangan Timur',
    bounds: [
      [-7.6, 107.75],
      [-7.0, 108.65],
    ],
  },
];

const areaOf = ([[south, west], [north, east]]) => ({ south, west, north, east });

/**
 * Section PETA SEBARAN (blueprint "Square plate, spare text"): peta SIG persegi di kiri;
 * di kanan tab wilayah, judul, jumlah alumni di wilayah itu, dan dua aksi.
 */
export default function ServiceMapSection() {
  const [regionId, setRegionId] = useState('jabar');
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  // Setelah "Cara memesan" diklik, tombolnya tetap biru sebagai tanda pilihan aktif.
  const [howChosen, setHowChosen] = useState(false);
  const plateRef = useInViewClass();
  const region = REGIONS.find((r) => r.id === regionId);
  const inRegion = SAMPLE_PROVIDERS.filter((p) => inArea(p, areaOf(region.bounds)));
  const cities = new Set(inRegion.map((p) => p.city)).size;

  return (
    <section className="showcase" aria-labelledby="map-title">
      <div ref={plateRef} className="showcase__plate shutter">
        <Suspense fallback={<div className="pm pm--loading">Memuat peta…</div>}>
          <ProviderMap
            providers={SAMPLE_PROVIDERS}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            selectedId={selectedId}
            onSelect={setSelectedId}
            scrollZoom={false}
            focus={region.bounds}
          />
        </Suspense>
      </div>

      <div className="showcase__side">
        <div className="showcase__tabs" role="group" aria-label="Tampilkan wilayah di peta">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              type="button"
              className="showcase__tab"
              aria-pressed={r.id === regionId}
              onClick={() => {
                setRegionId(r.id);
                setSelectedId(null);
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="showcase__body">
          <h2 id="map-title" className="section-title">
            Peta Sebaran Layanan
          </h2>
          <p className="showcase__desc" aria-live="polite">
            Di {region.name} ada <strong>{inRegion.length} alumni</strong> di {cities} kota dan
            kabupaten. Klik pin harga untuk melihat penyedia, atau perbesar peta dengan tombol + dan
            −.
          </p>
        </div>

        <div className="showcase__actions">
          <Link to={PATHS.services} className="showcase__cell showcase__cell--ink">
            Buka peta lengkap
          </Link>
          <a
            href="#cara-pesan"
            className={`showcase__cell${howChosen ? ' is-active' : ''}`}
            onClick={() => setHowChosen(true)}
          >
            Cara memesan
          </a>
        </div>
      </div>
    </section>
  );
}
