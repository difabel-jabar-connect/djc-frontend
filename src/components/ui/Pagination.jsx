import { Link } from 'react-router';
import { getPageItems } from '@/lib/pagination';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import './Pagination.css';

/**
 * Navigasi halaman hasil. `buildHref(page)` menghasilkan URL tiap halaman,
 * jadi setiap halaman bisa dibuka langsung dan tombol back browser tetap jalan.
 */
export default function Pagination({ page, totalPages, buildHref, label = 'Halaman hasil' }) {
  const items = getPageItems(page, totalPages);

  return (
    <nav aria-label={label} className="pagination">
      <ul className="pagination__list">
        <li>
          {page > 1 ? (
            <Link
              to={buildHref(page - 1)}
              className="pagination__item pagination__item--nav"
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeftIcon />
            </Link>
          ) : (
            <button
              type="button"
              className="pagination__item pagination__item--disabled"
              disabled
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeftIcon />
            </button>
          )}
        </li>
        {items.map((item, index) =>
          item === '…' ? (
            <li key={`gap-${index}`} className="pagination__gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                to={buildHref(item)}
                className="pagination__item"
                aria-current={item === page ? 'page' : undefined}
                aria-label={`Halaman ${item}${item === totalPages && totalPages > 1 ? ', terakhir' : ''}`}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < totalPages ? (
            <Link
              to={buildHref(page + 1)}
              className="pagination__item pagination__item--nav"
              aria-label="Halaman berikutnya"
            >
              <ChevronRightIcon />
            </Link>
          ) : (
            <button
              type="button"
              className="pagination__item pagination__item--disabled"
              disabled
              aria-label="Halaman berikutnya"
            >
              <ChevronRightIcon />
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
}
