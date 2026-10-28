import { useId, useRef } from 'react';
import Pagination from '@/components/ui/Pagination';
import {
  BanIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  FlagIcon,
  GiftIcon,
  HandIcon,
  HeartIcon,
  HomeIcon,
  MailIcon,
  PaletteIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  ScissorsIcon,
  SearchIcon,
  ShieldIcon,
  SparkleIcon,
  TagIcon,
  TrashIcon,
  UserCheckIcon,
  UserIcon,
  UserPlusIcon,
  UtensilsIcon,
  WrenchIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { USER_ROLES } from '@/features/admin/adminData';

/** Judul halaman admin + deskripsi; `children` = tombol aksi di kanan. */
export function PageHeader({ title, lead, readOnly = false, headingRef, children }) {
  return (
    <div className="ad-page-head">
      <div className="ad-page-head__text">
        <div className="ad-page-head__title-row">
          <h1 ref={headingRef} tabIndex={-1} className="ad-page-head__title">
            {title}
          </h1>
          {readOnly && <ReadOnlyBadge />}
        </div>
        {lead && <p className="ad-page-head__lead">{lead}</p>}
      </div>
      {children && <div className="ad-page-head__actions">{children}</div>}
    </div>
  );
}

export function ReadOnlyBadge({ small = false }) {
  return (
    <span className={`ad-readonly${small ? ' ad-readonly--sm' : ''}`}>
      <EyeIcon size={small ? 14 : 16} strokeWidth={2.25} />
      Hanya baca
    </span>
  );
}

/** Badge status/peran bertitik. `outlined` = dengan garis tepi (Audit Log, panel). */
export function Badge({ tone, icon: Icon, iconNode, outlined = false, large = false, children }) {
  return (
    <span
      className={`ad-badge tone-${tone}${outlined ? ' ad-badge--outlined' : ''}${large ? ' ad-badge--lg' : ''}`}
    >
      {iconNode ??
        (Icon ? (
          <Icon size={14} strokeWidth={2.5} />
        ) : (
          <span className="ad-badge__dot" aria-hidden="true" />
        ))}
      {children}
    </span>
  );
}

const ROLE_ICONS = { pengguna: UserIcon, penyedia: BriefcaseIcon, pengelola: ShieldIcon };

export function RoleBadge({ role }) {
  const meta = USER_ROLES[role];
  return (
    <Badge tone={meta.tone} icon={ROLE_ICONS[role]}>
      {meta.label}
    </Badge>
  );
}

/** Avatar inisial berwarna. `person` = { initials, color }. */
export function Avatar({ person, size = 36 }) {
  return (
    <span
      className="ad-avatar"
      style={{ backgroundColor: person.color, '--avatar-size': `${size}px` }}
      aria-hidden="true"
    >
      {person.initials}
    </span>
  );
}

/** Nama + baris kedua (email/kota) dengan avatar. */
export function PersonCell({ person, secondary, suffix, size = 36 }) {
  return (
    <span className="ad-person">
      <Avatar person={person} size={size} />
      <span className="ad-person__text">
        <strong>
          {person.name}
          {suffix}
        </strong>
        {secondary && <span>{secondary}</span>}
      </span>
    </span>
  );
}

const CATEGORY_ICONS = {
  sparkle: SparkleIcon,
  wrench: WrenchIcon,
  scissors: ScissorsIcon,
  food: UtensilsIcon,
  palette: PaletteIcon,
  hand: HandIcon,
  gift: GiftIcon,
  home: HomeIcon,
  briefcase: BriefcaseIcon,
  calendar: CalendarIcon,
  heart: HeartIcon,
  tag: TagIcon,
};

export function CategoryIcon({ icon, size = 20, ...props }) {
  const Icon = CATEGORY_ICONS[icon] ?? TagIcon;
  return <Icon size={size} {...props} />;
}

/**
 * Tab penyaring (pola WAI-ARIA Tabs): panah kiri/kanan, Home/End berpindah tab.
 * Panel milik halaman memakai `id={panelId}` dan `aria-labelledby={tabId(value)}`.
 */
export function Tabs({ label, tabs, value, onChange, panelId }) {
  const refs = useRef({});
  const onKeyDown = (event) => {
    const index = tabs.findIndex((tab) => tab.value === value);
    const moves = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = tabs[(moves[event.key] + tabs.length) % tabs.length];
    onChange(next.value);
    refs.current[next.value]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className="ad-tabs">
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(node) => {
              refs.current[tab.value] = node;
            }}
            id={`${panelId}-tab-${tab.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            className="ad-tab"
            onClick={() => onChange(tab.value)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ad-tab__count">
                <span className="visually-hidden">, </span>
                {tab.count.toLocaleString('id-ID')}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchField({ label, value, onChange, width }) {
  const id = useId();
  return (
    <div className="ad-search" style={width ? { width } : undefined}>
      <SearchIcon size={18} strokeWidth={2.25} />
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <input
        id={id}
        type="search"
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Filter pilihan bergaya chip ("Peran: Semua") dengan `<select>` asli. */
export function FilterSelect({ label, value, onChange, options, icon: Icon, hideLabel = false }) {
  const id = useId();
  return (
    <div className="ad-select">
      {Icon && <Icon size={18} className="ad-select__icon" />}
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : 'ad-select__label'}>
        {label}
        {hideLabel ? '' : ':'}
      </label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={18} className="ad-select__chevron" />
    </div>
  );
}

/** "Menampilkan 1–10 dari 12 user" + nomor halaman. */
export function TableFooter({ paging, noun }) {
  if (!paging.total) return null;
  return (
    <div className="ad-table-foot">
      <p aria-live="polite">
        Menampilkan {paging.from}–{paging.to} dari {paging.total.toLocaleString('id-ID')} {noun}
      </p>
      {paging.totalPages > 1 && (
        <Pagination
          page={paging.page}
          totalPages={paging.totalPages}
          buildHref={paging.buildHref}
          label={`Navigasi halaman ${noun}`}
        />
      )}
    </div>
  );
}

/** State kosong (desain State Admin). */
export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="ad-empty">
      <span className="ad-empty__icon" aria-hidden="true">
        <Icon size={40} strokeWidth={1.8} />
      </span>
      <h2 className="ad-empty__title">{title}</h2>
      {children && <p className="ad-empty__text">{children}</p>}
      {action}
    </div>
  );
}

/** Bagian dalam drawer: judul huruf kapital teal dengan ikon. */
export function DrawerSection({ title, icon: Icon, children, id }) {
  return (
    <section className="ad-dsection" aria-labelledby={id}>
      <h3 id={id} className="ad-dsection__title">
        <Icon size={18} />
        {title}
      </h3>
      {children}
    </section>
  );
}

/** Daftar keterangan dua kolom (dt/dd). `rows` = [[label, nilai], …]. */
export function DetailList({ rows }) {
  return (
    <dl className="ad-dl">
      {rows.map(([term, value]) => (
        <div key={term} className="ad-dl__row">
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const AUDIT_ICONS = {
  setujui_penyedia: CheckCircleIcon,
  tolak_penyedia: XCircleIcon,
  buat_akun: UserPlusIcon,
  kirim_undangan: MailIcon,
  suspensi_akun: BanIcon,
  aktifkan_akun: UserCheckIcon,
  sembunyikan_ulasan: EyeOffIcon,
  tampilkan_ulasan: EyeIcon,
  abaikan_laporan: FlagIcon,
  tambah_kategori: PlusIcon,
  ubah_kategori: PencilIcon,
  nonaktifkan_kategori: PowerIcon,
  aktifkan_kategori: PowerIcon,
  hapus_kategori: TrashIcon,
  batal_otomatis: ClockIcon,
};

/** Ikon untuk jenis aksi Audit Log. */
export function AuditActionIcon({ action, ...props }) {
  const Icon = AUDIT_ICONS[action] ?? ClockIcon;
  return <Icon {...props} />;
}
