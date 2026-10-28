import { NavLink } from 'react-router';
import { AlertIcon, CheckIcon, DownloadIcon, StarFilledIcon } from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { ALUMNI_STATUS, PROFILE_FIELDS, profileScore } from '@/features/pengelola/pengelolaData';
import { downloadFile, formatScore, toCsv } from '@/features/pengelola/pengelolaFormat';
import { PATHS } from '@/routes/paths';
import { Badge, CategoryIcon } from '../admin/AdminParts';

export function AlumniStatusBadge({ status }) {
  const meta = ALUMNI_STATUS[status];
  return (
    <Badge tone={meta.tone} icon={status === 'terverifikasi' ? CheckIcon : AlertIcon}>
      {meta.label}
    </Badge>
  );
}

/** Bilah kelengkapan profil 0–10 (desain Data Alumni). */
export function ProfileProgress({ alumni, label = 'Kelengkapan profil' }) {
  const done = profileScore(alumni);
  const total = PROFILE_FIELDS.length;
  const level = done === total ? 'full' : done >= 8 ? 'mid' : 'low';
  return (
    <span className="ad-progress">
      <span
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${label} ${done} dari ${total}`}
        className="ad-progress__track"
      >
        <span
          className={`ad-progress__bar pg-progress--${level}`}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </span>
      <strong aria-hidden="true">
        {done}/{total}
      </strong>
    </span>
  );
}

/** Kartu angka ringkas berikon (Ringkasan Data Alumni, Wilayah). */
export function SummaryTiles({ label, items, columns }) {
  return (
    <ul
      className="pg-tiles"
      aria-label={label}
      style={columns ? { '--pg-tiles': columns } : undefined}
    >
      {items.map(({ label: itemLabel, value, suffix, icon: Icon, tone = 'navy' }) => (
        <li key={itemLabel} className="dash-card pg-tile">
          <span className={`pg-tile__icon tone-${tone}`} aria-hidden="true">
            <Icon size={20} strokeWidth={2.25} />
          </span>
          <span className="pg-tile__text">
            <span>{itemLabel}</span>
            <strong>
              {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
              {suffix && <span className="pg-tile__suffix"> {suffix}</span>}
            </strong>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CategoryLabel({ id }) {
  const { categories } = useAdmin();
  const category = categories.find((c) => c.id === id);
  return (
    <span className="pg-cat">
      <CategoryIcon icon={category?.icon} size={18} />
      {category?.name ?? '–'}
    </span>
  );
}

/** "★ 4,9 (32)" — atau "Belum ada" bila belum diulas. */
export function RatingCell({ rating, count }) {
  if (rating == null) return <span className="ad-muted-cell">Belum ada</span>;
  return (
    <span className="pg-rating" aria-label={`Rating ${formatScore(rating)} dari ${count} ulasan`}>
      <StarFilledIcon size={16} aria-hidden="true" />
      <strong aria-hidden="true">{formatScore(rating)}</strong>
      <span aria-hidden="true">({count})</span>
    </span>
  );
}

/** Tab Data Layanan (tautan antar halaman: Daftar / Kategori). */
export function ServiceTabs() {
  return (
    <nav aria-label="Bagian Data Layanan" className="ad-tabs pg-tablinks">
      <NavLink to={PATHS.pengelolaServices} end className="ad-tab">
        Daftar Layanan
      </NavLink>
      <NavLink to={PATHS.pengelolaCategories} className="ad-tab">
        Kategori Layanan
      </NavLink>
    </nav>
  );
}

/** Tombol "Unduh CSV" untuk tabel yang sedang tampil. */
export function CsvButton({ filename, columns, rows, noun }) {
  const { notify } = useAdmin();
  return (
    <button
      type="button"
      className="btn btn--outline btn--md"
      onClick={() => {
        downloadFile(`${filename}.csv`, toCsv(columns, rows), 'text/csv;charset=utf-8');
        notify(`CSV ${rows.length} ${noun} diunduh.`);
      }}
    >
      <DownloadIcon size={18} strokeWidth={2.25} />
      Unduh CSV
    </button>
  );
}
