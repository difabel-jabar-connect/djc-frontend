import { useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import searchIcon from '@/assets/icons/search.svg';
import searchWhiteIcon from '@/assets/icons/search-white.svg';
import locationIcon from '@/assets/icons/location.svg';
import chevronDown from '@/assets/icons/chevron-down.svg';
import { CITIES, POPULAR_CATEGORIES, matchCategories } from '@/features/search/catalog';
import { buildServicesPath } from '@/routes/paths';

/**
 * Form pencarian hero Beranda (setelah masuk): hanya mencari **kategori layanan** — bukan
 * nama penyedia atau kota. Ketik jenis layanan (mis. "kipas") → saran kategori (combobox
 * ARIA, bisa dengan panah ↑/↓ + Enter). Lokasi bisa dikendalikan dari luar
 * (`city` + `onCityChange`), dipakai tombol "Ubah" lokasi.
 */
export function HeroSearchForm({ city, onCityChange, selectRef }) {
  const navigate = useNavigate();
  const id = useId();
  const listId = `${id}-kategori`;
  const errorId = `${id}-error`;
  const inputRef = useRef(null);
  const controlled = city !== undefined;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState('');
  const options = matchCategories(query);

  const choose = (category) => {
    setSelected(category);
    setQuery(category.label);
    setOpen(false);
    setActive(-1);
    setError('');
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
    setSelected(null);
    setOpen(true);
    setActive(-1);
    setError('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!options.length) return;
      setOpen(true);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => (current + step + options.length) % options.length);
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const lokasi = new FormData(event.currentTarget).get('lokasi');
    // Teks bebas hanya diterima bila menunjuk tepat satu kategori.
    const category = selected ?? (query.trim() && options.length === 1 ? options[0] : null);
    if (query.trim() && !category) {
      setError(
        options.length
          ? 'Pilih salah satu kategori layanan dari daftar saran.'
          : 'Kategori layanan tidak ditemukan. Coba kata lain, mis. "jahit" atau "servis".',
      );
      setOpen(options.length > 0);
      inputRef.current?.focus();
      return;
    }
    navigate(buildServicesPath({ kategori: category?.slug, lokasi }));
  };

  const expanded = open && options.length > 0;

  return (
    <form
      className="hero-search"
      role="search"
      aria-label="Cari layanan"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="hero-search__combo">
        <div className={`hero-search__field${error ? ' hero-search__field--invalid' : ''}`}>
          <img src={searchIcon} alt="" width="24" height="24" />
          <label htmlFor={`${id}-q`} className="visually-hidden">
            Kategori layanan
          </label>
          <input
            ref={inputRef}
            id={`${id}-q`}
            type="text"
            role="combobox"
            className="hero-search__input"
            placeholder="Cari kategori layanan, mis. jahit, servis, kue"
            autoComplete="off"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div
          id={listId}
          role="listbox"
          aria-label="Saran kategori layanan"
          className="hero-search__options"
          hidden={!expanded}
        >
          {options.map((category, index) => (
            <div
              key={category.slug}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              // Fokus tetap di input (aria-activedescendant); -1 agar tidak masuk urutan Tab.
              tabIndex={-1}
              className={`hero-search__option${index === active ? ' is-active' : ''}`}
              // mousedown agar terpilih sebelum input kehilangan fokus (blur menutup daftar).
              onMouseDown={(event) => {
                event.preventDefault();
                choose(category);
              }}
            >
              <img src={category.icon} alt="" width="20" height="20" />
              {category.label}
            </div>
          ))}
        </div>
        {error && (
          <p id={errorId} className="field-error hero-search__error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="hero-search__row">
        <div className="hero-search__location">
          <img src={locationIcon} alt="" width="22" height="22" />
          <label htmlFor={`${id}-lokasi`} className="hero-search__location-label">
            Lokasi
          </label>
          <select
            ref={selectRef}
            id={`${id}-lokasi`}
            name="lokasi"
            className="hero-search__select"
            {...(controlled
              ? { value: city, onChange: (event) => onCityChange(event.target.value) }
              : { defaultValue: '' })}
          >
            <option value="">Semua kota/kabupaten</option>
            {CITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <img src={chevronDown} alt="" width="20" height="20" className="hero-search__chevron" />
        </div>
        <button type="submit" className="btn btn--primary btn--lg hero-search__submit">
          <img src={searchWhiteIcon} alt="" width="20" height="20" />
          Cari Layanan
        </button>
      </div>
    </form>
  );
}

/** Chip kategori populer → halaman Cari Layanan dengan filter kategori. */
export function PopularCategories() {
  return (
    <>
      <h2 id="popular-categories" className="hero__subheading">
        Kategori populer
      </h2>
      <ul className="category-chips" aria-labelledby="popular-categories">
        {POPULAR_CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link to={buildServicesPath({ kategori: category.slug })} className="category-chip">
              <img src={category.icon} alt="" width="20" height="20" />
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
