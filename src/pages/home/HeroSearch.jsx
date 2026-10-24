import { Link, useNavigate } from 'react-router';
import searchIcon from '@/assets/icons/search.svg';
import searchWhiteIcon from '@/assets/icons/search-white.svg';
import locationIcon from '@/assets/icons/location.svg';
import chevronDown from '@/assets/icons/chevron-down.svg';
import { CITIES, POPULAR_CATEGORIES } from '@/features/search/catalog';
import { buildServicesPath } from '@/routes/paths';

/**
 * Form pencarian hero (Beranda umum & Beranda setelah masuk).
 * Lokasi bisa dikendalikan dari luar (`city` + `onCityChange`) — dipakai tombol "Ubah" lokasi.
 */
export function HeroSearchForm({ city, onCityChange, selectRef }) {
  const navigate = useNavigate();
  const controlled = city !== undefined;

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    navigate(
      buildServicesPath({
        q: String(form.get('q') ?? '').trim(),
        lokasi: form.get('lokasi'),
      }),
    );
  };

  return (
    <form className="hero-search" role="search" aria-label="Cari layanan" onSubmit={handleSubmit}>
      <div className="hero-search__field">
        <img src={searchIcon} alt="" width="24" height="24" />
        <label htmlFor="hero-q" className="visually-hidden">
          Kata kunci pencarian
        </label>
        <input
          id="hero-q"
          name="q"
          type="search"
          className="hero-search__input"
          placeholder="Cari layanan, kategori, lokasi, atau nama penyedia"
          autoComplete="off"
        />
      </div>
      <div className="hero-search__row">
        <div className="hero-search__location">
          <img src={locationIcon} alt="" width="22" height="22" />
          <label htmlFor="hero-lokasi" className="hero-search__location-label">
            Lokasi
          </label>
          <select
            ref={selectRef}
            id="hero-lokasi"
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
