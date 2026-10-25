import {
  CATEGORIES,
  CITIES,
  DAY_OPTIONS,
  PRICE_OPTIONS,
  RATING_OPTIONS,
} from '@/features/search/catalog';
import { describeActiveFilters } from '@/features/search/searchProviders';
import {
  CalendarIcon,
  ChevronDownIcon,
  FilterIcon,
  GridIcon,
  MapPinIcon,
  ResetIcon,
  SearchIcon,
  StarOutlineIcon,
  WalletIcon,
} from '@/components/ui/icons';

const FILTERS = [
  {
    key: 'kategori',
    id: 'f-kategori',
    label: 'Kategori Layanan',
    icon: GridIcon,
    placeholder: 'Semua kategori',
    options: CATEGORIES.map((c) => ({ value: c.slug, label: c.label })),
  },
  {
    key: 'lokasi',
    id: 'f-kota',
    label: 'Lokasi Kota',
    icon: MapPinIcon,
    placeholder: 'Semua kota',
    options: CITIES.map((city) => ({ value: city, label: city })),
  },
  {
    key: 'rating',
    id: 'f-rating',
    label: 'Rating Minimal',
    icon: StarOutlineIcon,
    placeholder: 'Semua rating',
    options: RATING_OPTIONS,
  },
  {
    key: 'harga',
    id: 'f-harga',
    label: 'Harga',
    icon: WalletIcon,
    placeholder: 'Semua harga',
    options: PRICE_OPTIONS,
  },
  {
    key: 'hari',
    id: 'f-hari',
    label: 'Ketersediaan Hari',
    icon: CalendarIcon,
    placeholder: 'Semua hari',
    options: DAY_OPTIONS,
  },
];

/** Section 3. PANEL PENCARIAN — kata kunci + 5 filter. Filter langsung diterapkan saat diubah. */
export default function SearchPanel({ criteria, onSearch, onFilterChange, onReset }) {
  const active = describeActiveFilters(criteria);

  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch(String(new FormData(event.currentTarget).get('q') ?? '').trim());
  };

  return (
    <div className="container search-panel">
      <form
        className="search-panel__form"
        role="search"
        aria-label="Cari dan saring layanan"
        onSubmit={handleSubmit}
      >
        <div className="search-panel__query">
          <label htmlFor="q" className="visually-hidden">
            Cari layanan, nama penyedia, atau kata kunci
          </label>
          <div className="input-shell input-shell--lg">
            <SearchIcon size={24} className="input-shell__icon input-shell__icon--primary" />
            {/* key: isi ulang input saat kata kunci di URL berubah (mis. tombol back). */}
            <input
              key={criteria.q}
              id="q"
              name="q"
              type="search"
              className="input-shell__control"
              placeholder="Cari layanan, nama penyedia, atau kata kunci..."
              defaultValue={criteria.q}
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn btn--primary search-panel__submit">
            <SearchIcon strokeWidth={2.25} />
            Cari
          </button>
        </div>

        <div className="search-panel__filters">
          {FILTERS.map(({ key, id, label, icon: Icon, placeholder, options }) => (
            <div key={key} className="search-panel__filter">
              <label htmlFor={id} className="search-panel__label">
                {label}
              </label>
              <div className="input-shell">
                <Icon className="input-shell__icon" />
                <select
                  id={id}
                  className="input-shell__control input-shell__select"
                  value={criteria[key]}
                  onChange={(event) => onFilterChange(key, event.target.value)}
                >
                  <option value="">{placeholder}</option>
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="input-shell__chevron" />
              </div>
            </div>
          ))}
        </div>

        <div className="search-panel__footer">
          <p className="search-panel__active" aria-live="polite">
            <FilterIcon />
            Filter aktif: <strong>{active.length ? active.join(', ') : 'tidak ada'}</strong>
          </p>
          <button type="button" className="link-button" onClick={onReset} disabled={!active.length}>
            <ResetIcon />
            Reset Filter
          </button>
        </div>
      </form>
    </div>
  );
}
