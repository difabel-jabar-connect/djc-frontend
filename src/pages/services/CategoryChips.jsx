import { useCategories } from '@/features/search/useCategories';
import { CheckIcon } from '@/components/ui/icons';

/** Section 4. CHIP KATEGORI — toggle cepat filter kategori (sinkron dengan dropdown & API). */
export default function CategoryChips({ value, onChange }) {
  const categories = useCategories();
  return (
    <div className="container category-filter">
      <div role="group" aria-label="Kategori layanan" className="category-filter__list">
        <button
          type="button"
          className="filter-chip"
          aria-pressed={!value}
          onClick={() => onChange('')}
        >
          {!value && <CheckIcon />}
          Semua
        </button>
        {categories.map((category) => {
          const pressed = value === category.slug;
          return (
            <button
              key={category.slug}
              type="button"
              className="filter-chip"
              aria-pressed={pressed}
              onClick={() => onChange(pressed ? '' : category.slug)}
            >
              {pressed ? (
                <CheckIcon />
              ) : (
                category.icon && <img src={category.icon} alt="" width="20" height="20" />
              )}
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
