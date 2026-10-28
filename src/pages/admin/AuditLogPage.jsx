import { Fragment, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  HistoryIcon,
  ResetIcon,
  SettingsIcon,
  UsersIcon,
  XIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { AUDIT_ACTIONS } from '@/features/admin/adminData';
import {
  DATE_RANGE_OPTIONS,
  formatDate,
  formatTime,
  inDateRange,
} from '@/features/admin/adminFormat';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS, buildAdminPath } from '@/routes/paths';
import {
  Avatar,
  AuditActionIcon,
  Badge,
  EmptyState,
  FilterSelect,
  PageHeader,
  TableFooter,
} from './AdminParts';
import { usePagedList } from './usePagedList';

const PAGE_SIZE = 8;

/** Tautan target log ke halaman terkait (dengan kata kunci pencarian). */
function targetHref(entry) {
  const { type, label } = entry.target;
  switch (type) {
    case 'user':
      return buildAdminPath(PATHS.adminUsers, { cari: label });
    case 'verifikasi':
      return buildAdminPath(PATHS.adminVerification, {
        cari: label,
        tab: { setujui_penyedia: 'disetujui', tolak_penyedia: 'ditolak' }[entry.action],
      });
    case 'ulasan':
      return buildAdminPath(PATHS.adminReviews, { cari: label });
    case 'pesanan':
      return buildAdminPath(PATHS.adminOrders, { cari: label });
    default:
      return PATHS.adminCategories;
  }
}

function ActorCell({ actor }) {
  if (actor.system) {
    return (
      <span className="ad-person">
        <span
          className="ad-avatar ad-avatar--system"
          style={{ '--avatar-size': '32px' }}
          aria-hidden="true"
        >
          <SettingsIcon size={18} />
        </span>
        <span className="ad-person__text">
          <strong>Sistem</strong>
          <span>Otomatis</span>
        </span>
      </span>
    );
  }
  return (
    <span className="ad-person">
      <Avatar person={actor} size={32} />
      <span className="ad-person__text">
        <strong>{actor.name}</strong>
        <span>Admin</span>
      </span>
    </span>
  );
}

/** Audit Log (desain Audit Log): hanya baca, filter aktor/aksi/tanggal, baris bisa dibuka. */
export default function AuditLogPage() {
  useDocumentTitle('Audit Log');
  const { audit } = useAdmin();
  const [actor, setActor] = useState('');
  const [action, setAction] = useState('');
  const [range, setRange] = useState('');
  const [expanded, setExpanded] = useState(null);

  const actorOptions = useMemo(
    () => [...new Set(audit.map((entry) => entry.actor.name))].sort(),
    [audit],
  );
  const rows = audit
    .filter((entry) => !actor || entry.actor.name === actor)
    .filter((entry) => !action || entry.action === action)
    .filter((entry) => inDateRange(entry.at, range));
  const paging = usePagedList(rows, PAGE_SIZE);

  const set = (setter) => (value) => {
    setter(value);
    setExpanded(null);
    paging.resetPage();
  };
  const resetFilters = () => {
    setActor('');
    setAction('');
    setRange('');
    paging.resetPage();
  };

  const chips = [
    actor && { label: `Aktor: ${actor}`, clear: () => set(setActor)('') },
    action && { label: `Aksi: ${AUDIT_ACTIONS[action].label}`, clear: () => set(setAction)('') },
    range && {
      label: `Tanggal: ${DATE_RANGE_OPTIONS.find((o) => o.value === range).label}`,
      clear: () => set(setRange)(''),
    },
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        title="Audit Log"
        lead="Catatan seluruh aksi admin dan sistem. Data tidak dapat diubah atau dihapus."
        readOnly
      />

      <section className="dash-card dash-panel ad-list-card" aria-label="Audit log">
        <div role="search" className="ad-filters">
          <FilterSelect
            label="Aktor"
            icon={UsersIcon}
            value={actor}
            onChange={set(setActor)}
            options={[
              { value: '', label: 'Semua aktor' },
              ...actorOptions.map((name) => ({ value: name, label: name })),
            ]}
          />
          <FilterSelect
            label="Aksi"
            value={action}
            onChange={set(setAction)}
            options={[
              { value: '', label: 'Semua aksi' },
              ...Object.entries(AUDIT_ACTIONS).map(([value, meta]) => ({
                value,
                label: meta.label,
              })),
            ]}
          />
          <FilterSelect
            label="Tanggal"
            icon={CalendarIcon}
            value={range}
            onChange={set(setRange)}
            options={DATE_RANGE_OPTIONS}
          />
          {chips.length > 0 && (
            <button
              type="button"
              className="btn ad-btn-ghost ad-btn-md ad-push-end"
              onClick={resetFilters}
            >
              <ResetIcon size={18} />
              Reset Filter
            </button>
          )}
        </div>

        {chips.length > 0 && (
          <div className="ad-active-filters">
            <span>Filter aktif:</span>
            <ul>
              {chips.map((chip) => (
                <li key={chip.label} className="ad-filter-chip">
                  {chip.label}
                  <button
                    type="button"
                    aria-label={`Hapus filter ${chip.label}`}
                    onClick={chip.clear}
                  >
                    <XIcon size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title="Tidak ada log untuk filter ini"
            action={
              <button type="button" className="btn btn--primary" onClick={resetFilters}>
                <ResetIcon size={18} />
                Reset Filter
              </button>
            }
          >
            Coba ubah rentang tanggal atau jenis aksi.
          </EmptyState>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table ad-table ad-table--audit">
                <caption className="visually-hidden">Audit log, hanya baca</caption>
                <thead>
                  <tr>
                    <th scope="col">Waktu</th>
                    <th scope="col">Aktor</th>
                    <th scope="col">Aksi</th>
                    <th scope="col">Target</th>
                    <th scope="col">Alasan</th>
                    <th scope="col">
                      <span className="visually-hidden">Detail</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paging.pageItems.map((entry) => {
                    const meta = AUDIT_ACTIONS[entry.action];
                    const open = expanded === entry.id;
                    const stamp = `${formatDate(entry.at)} ${formatTime(entry.at)} WIB`;
                    return (
                      <Fragment key={entry.id}>
                        <tr className={open ? 'ad-row--open' : undefined}>
                          <td>
                            <span className="ad-stack">
                              <strong className="ad-nowrap">{formatDate(entry.at)}</strong>
                              <span className="ad-sub">{formatTime(entry.at)} WIB</span>
                            </span>
                          </td>
                          <td>
                            <ActorCell actor={entry.actor} />
                          </td>
                          <td>
                            <Badge
                              tone={meta.tone}
                              outlined
                              iconNode={
                                <AuditActionIcon
                                  action={entry.action}
                                  size={14}
                                  strokeWidth={2.5}
                                />
                              }
                            >
                              {meta.label}
                            </Badge>
                          </td>
                          <td>
                            <Link to={targetHref(entry)} className="ad-target-link">
                              {entry.target.label}
                            </Link>
                          </td>
                          <td>
                            <span className="ad-ellipsis">{entry.reason || '–'}</span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`ad-icon-btn${open ? ' is-open' : ''}`}
                              aria-expanded={open}
                              aria-controls={`${entry.id}-detail`}
                              aria-label={`${open ? 'Tutup' : 'Lihat'} detail log ${stamp}`}
                              onClick={() => setExpanded(open ? null : entry.id)}
                            >
                              <ChevronDownIcon size={18} strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>
                        <tr id={`${entry.id}-detail`} className="ad-row-detail" hidden={!open}>
                          <td colSpan={6}>
                            <div className="ad-log-detail">
                              <div>
                                <span className="ad-log-detail__label">Alasan lengkap</span>
                                <p>{entry.reason || 'Tidak ada catatan.'}</p>
                              </div>
                              <div>
                                <span className="ad-log-detail__label">Sebelum → sesudah</span>
                                {entry.change ? (
                                  <p className="ad-change">
                                    {entry.change.field}:{' '}
                                    <Badge tone={entry.change.beforeTone}>
                                      {entry.change.before}
                                    </Badge>
                                    <ArrowRightIcon size={16} aria-hidden="true" />
                                    <span className="visually-hidden">menjadi</span>
                                    <Badge tone={entry.change.afterTone}>
                                      {entry.change.after}
                                    </Badge>
                                  </p>
                                ) : (
                                  <p>–</p>
                                )}
                              </div>
                              <div>
                                <span className="ad-log-detail__label">ID log</span>
                                <p className="ad-code">{entry.id}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter paging={paging} noun="log" />
          </>
        )}
      </section>
    </>
  );
}
