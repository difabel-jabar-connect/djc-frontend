import { useSearchParams } from 'react-router';
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
import DistributionMapCard from './DistributionMapCard';
import RequestHelpCard from './RequestHelpCard';
import './services.css';

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

  const result = paginate(filterProviders(SAMPLE_PROVIDERS, criteria), criteria.page);

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
      <div className="container search-layout">
        <SearchResults
          result={result}
          sort={criteria.urut}
          onSortChange={(urut) => updateParams({ urut: urut === 'relevan' ? '' : urut })}
          buildPageHref={buildPageHref}
          onReset={resetFilters}
        />
        <aside className="search-layout__aside" aria-label="Informasi tambahan">
          <DistributionMapCard />
          <RequestHelpCard />
        </aside>
      </div>
    </>
  );
}
