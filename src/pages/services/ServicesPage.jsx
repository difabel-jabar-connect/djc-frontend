import { lazy, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ClipboardListIcon, MapIcon } from '@/components/ui/icons';
import { inArea } from '@/features/map/jabarGeo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SAMPLE_PROVIDERS } from '@/features/providers/sampleProviders';
import {
  FILTER_KEYS,
  filterProviders,
  paginate,
  readCriteria,
} from '@/features/search/searchProviders';
import { PATHS } from '@/routes/paths';
import SearchPageHeader from './SearchPageHeader';
import SearchPanel from './SearchPanel';
import CategoryChips from './CategoryChips';
import SearchResults from './SearchResults';
import RequestHelpCard from './RequestHelpCard';
import './services.css';

// Leaflet hanya dimuat saat halaman Cari Layanan dibuka.
const ProviderMap = lazy(() => import('./ProviderMap'));

/**
 * Halaman Cari Layanan (FR-CUST-02). Seluruh kriteria disimpan di query string
 * (?q=&kategori=&lokasi=&rating=&harga=&hari=&urut=&hal=) agar hasil bisa
 * dibagikan, di-bookmark, dan tombol back browser bekerja.
 * Data sementara dari contoh lokal; nanti diganti panggilan API pencarian.
 */
export default function ServicesPage() {
  useDocumentTitle('Cari Layanan');
  const [searchParams, setSearchParams] = useSearchParams();
  const criteria = readCriteria(searchParams);

  const [area, setArea] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [mobileView, setMobileView] = useState('daftar');

  const filtered = filterProviders(SAMPLE_PROVIDERS, criteria);
  const inView = filtered.filter((provider) => inArea(provider, area));
  const result = paginate(inView, criteria.page);

  // Kartu peta ditutup bila penyedianya tidak lagi termasuk hasil.
  useEffect(() => {
    if (selectedId && !filtered.some((p) => p.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  const searchArea = (next) => {
    setArea(next);
    if (searchParams.has('hal')) {
      const params = new URLSearchParams(searchParams);
      params.delete('hal');
      setSearchParams(params, { replace: true });
    }
  };

  /** Ubah sebagian parameter; nilai kosong dihapus, halaman kembali ke 1. */
  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!('hal' in changes)) next.delete('hal');
    setSearchParams(next);
  };

  const resetFilters = () => {
    const next = new URLSearchParams(searchParams);
    ['q', 'hal', ...FILTER_KEYS].forEach((key) => next.delete(key));
    setSearchParams(next);
  };

  const buildPageHref = (page) => {
    const next = new URLSearchParams(searchParams);
    if (page > 1) next.set('hal', String(page));
    else next.delete('hal');
    const query = next.toString();
    return query ? `${PATHS.services}?${query}` : PATHS.services;
  };

  return (
    <>
      <SearchPageHeader />
      <SearchPanel
        criteria={criteria}
        onSearch={(q) => updateParams({ q })}
        onFilterChange={(key, value) => updateParams({ [key]: value })}
        onReset={resetFilters}
      />
      <CategoryChips
        value={criteria.kategori}
        onChange={(kategori) => updateParams({ kategori })}
      />
      <div
        className={`search-split${expanded ? ' is-expanded' : ''}${mobileView === 'peta' ? ' is-map-view' : ''}`}
      >
        <div className="search-split__list">
          <SearchResults
            result={result}
            sort={criteria.urut}
            onSortChange={(urut) => updateParams({ urut: urut === 'relevan' ? '' : urut })}
            buildPageHref={buildPageHref}
            onReset={() => {
              setArea(null);
              resetFilters();
            }}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            areaActive={Boolean(area)}
          />
          <RequestHelpCard />
        </div>
        <div className="search-split__map">
          <Suspense fallback={<div className="pm pm--loading">Memuat peta…</div>}>
            <ProviderMap
              providers={filtered}
              hoveredId={hoveredId}
              onHover={setHoveredId}
              selectedId={selectedId}
              onSelect={setSelectedId}
              areaActive={Boolean(area)}
              onAreaSearch={searchArea}
              expanded={expanded}
              onToggleExpand={() => setExpanded((value) => !value)}
            />
          </Suspense>
        </div>
        <button
          type="button"
          className="search-split__toggle"
          onClick={() => setMobileView((view) => (view === 'peta' ? 'daftar' : 'peta'))}
        >
          {mobileView === 'peta' ? (
            <>
              <ClipboardListIcon size={18} />
              Tampilkan daftar
            </>
          ) : (
            <>
              <MapIcon size={18} />
              Tampilkan peta
            </>
          )}
        </button>
      </div>
    </>
  );
}
