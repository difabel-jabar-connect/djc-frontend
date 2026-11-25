import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRightIcon } from '@/components/ui/icons';
import { useProviderSearch } from '@/features/search/useProviderSearch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS } from '@/routes/paths';
import CategoryChips from '@/pages/services/CategoryChips';
import '@/pages/services/services.css';

const ProviderMap = lazy(() => import('@/pages/services/ProviderMap'));

/** Peta sebaran penyedia jasa di Jawa Barat (FR-CUST-03, FR-CUST-04). */
export default function MapPage() {
  useDocumentTitle('Peta Penyedia Jasa');
  const [kategori, setKategori] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const search = useProviderSearch({ category: kategori || undefined, limit: 50 });

  return (
    <div className="container" style={{ paddingBlock: '24px 40px', display: 'grid', gap: '16px' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Peta Penyedia Jasa</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--color-text-muted)' }}>
            Sebaran penyedia jasa terverifikasi di Jawa Barat (koordinat publik dibulatkan ~1 km
            demi privasi).
          </p>
        </div>
        <Link to={PATHS.services} className="btn btn--outline btn--md">
          Buka pencarian daftar
          <ArrowRightIcon size={16} />
        </Link>
      </div>

      <CategoryChips value={kategori} onChange={setKategori} />

      <div style={{ minHeight: '540px', borderRadius: '16px', overflow: 'hidden' }}>
        <Suspense fallback={<div className="pm pm--loading">Memuat peta…</div>}>
          <ProviderMap
            providers={search.providers}
            hoveredId={hoveredId}
            onHover={setHoveredId}
            selectedId={selectedId}
            onSelect={setSelectedId}
            areaActive={false}
            onAreaSearch={() => {}}
            expanded
            onToggleExpand={() => {}}
          />
        </Suspense>
      </div>
    </div>
  );
}
