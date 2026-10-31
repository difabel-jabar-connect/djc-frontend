import { useEffect, useRef } from 'react';
import ServiceCard from '@/components/ui/ServiceCard';
import Pagination from '@/components/ui/Pagination';
import { ChevronDownIcon, SortIcon } from '@/components/ui/icons';
import { SORT_OPTIONS } from '@/features/search/catalog';

/** KIRI: jumlah hasil, urutan, kartu layanan, dan paginasi. */
export default function SearchResults({
  result,
  sort,
  onSortChange,
  buildPageHref,
  onReset,
  hoveredId,
  onHover = () => {},
  areaActive = false,
}) {
  const gridRef = useRef(null);
  const hoverRef = useRef(onHover);
  hoverRef.current = onHover;

  // Sorot pin peta saat kartu disentuh penunjuk atau mendapat fokus keyboard.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;
    const enter = (event) => {
      const id = event.target.closest?.('[data-provider]')?.dataset.provider ?? null;
      hoverRef.current(id);
    };
    const leave = (event) => {
      if (!grid.contains(event.relatedTarget)) hoverRef.current(null);
    };
    grid.addEventListener('pointerover', enter);
    grid.addEventListener('focusin', enter);
    grid.addEventListener('pointerleave', leave);
    grid.addEventListener('focusout', leave);
    return () => {
      grid.removeEventListener('pointerover', enter);
      grid.removeEventListener('focusin', enter);
      grid.removeEventListener('pointerleave', leave);
      grid.removeEventListener('focusout', leave);
    };
  }, [result.total]);

  return (
    <section className="results" aria-labelledby="hasil-title">
      <div className="results__head">
        <h2 id="hasil-title" className="results__title" aria-live="polite">
          Ditemukan <strong>{result.total}</strong> penyedia layanan
          {areaActive && <span className="results__area"> di area peta</span>}
        </h2>
        <div className="results__sort">
          <label htmlFor="urut" className="search-panel__label">
            Urutkan:
          </label>
          <div className="input-shell input-shell--sm">
            <SortIcon size={18} className="input-shell__icon" />
            <select
              id="urut"
              className="input-shell__control input-shell__select results__sort-select"
              value={sort}
              onChange={(event) => onSortChange(event.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="input-shell__chevron" />
          </div>
        </div>
      </div>

      {result.total > 0 ? (
        <>
          <ul ref={gridRef} className="results__grid">
            {result.items.map((provider) => (
              <li
                key={provider.id}
                data-provider={provider.id}
                className={hoveredId === provider.id ? 'is-hover' : undefined}
              >
                <ServiceCard provider={provider} />
              </li>
            ))}
          </ul>
          <div className="results__foot">
            <p className="results__range">
              Menampilkan{' '}
              <strong>
                {result.from}–{result.to}
              </strong>{' '}
              dari <strong>{result.total}</strong> penyedia layanan
            </p>
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              buildHref={buildPageHref}
              label="Halaman hasil pencarian"
            />
          </div>
        </>
      ) : (
        <div className="results__empty">
          <p className="results__empty-title">Belum ada layanan yang cocok.</p>
          <p>Coba kata kunci lain atau longgarkan filter pencarian Anda.</p>
          <button type="button" className="btn btn--outline" onClick={onReset}>
            Reset Filter
          </button>
        </div>
      )}
    </section>
  );
}
