import { ArrowUpIcon } from '@/components/ui/icons';

/** Badge tren hijau ("+12%") + keterangan pembanding. */
export function Trend({ value, note = 'dari bulan lalu' }) {
  return (
    <span className="dash-trend">
      <span className="dash-trend__pill">
        <ArrowUpIcon size={14} />
        {value}
      </span>
      {note}
    </span>
  );
}

/** Kartu statistik ringkas. `tone` mengatur warna ikon bulat. */
export function StatCard({ label, icon: Icon, tone = 'navy', value, children }) {
  return (
    <div className="dash-card dash-stat">
      <div className="dash-stat__head">
        <span className={`dash-stat__icon dash-stat__icon--${tone}`} aria-hidden="true">
          <Icon size={22} />
        </span>
        <span className="dash-stat__label">{label}</span>
      </div>
      <span className="dash-stat__value">{value}</span>
      {children}
    </div>
  );
}

/** Label status berwarna dengan titik/ikon. tone: success | warning | danger | info | orange. */
export function StatusBadge({ tone, icon: Icon, children }) {
  return (
    <span className={`dash-status dash-status--${tone}`}>
      {Icon ? <Icon size={14} /> : <span className="dash-status__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Kotak kepala section dashboard: judul + aksi opsional di kanan. */
export function PanelHead({ id, title, children }) {
  return (
    <div className="dash-panel__head">
      <h2 id={id} className="dash-panel__title">
        {title}
      </h2>
      {children}
    </div>
  );
}
