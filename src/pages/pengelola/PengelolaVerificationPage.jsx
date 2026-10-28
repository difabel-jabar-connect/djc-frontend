import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  CheckCircleIcon,
  CheckIcon,
  ClockIcon,
  FilterIcon,
  ResetIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { CHECKLIST_ITEMS, REJECT_QUICK_REASONS, completeness } from '@/features/admin/adminData';
import { daysSince, formatDate, formatWaiting } from '@/features/admin/adminFormat';
import { REVISION_SECTIONS } from '@/features/pengelola/pengelolaData';
import { usePengelolaActions } from '@/features/pengelola/usePengelolaActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ReasonDialog } from '../admin/AdminDialogs';
import {
  Badge,
  EmptyState,
  FilterSelect,
  PageHeader,
  PersonCell,
  SearchField,
  TableFooter,
  Tabs,
} from '../admin/AdminParts';
import { usePagedList } from '../admin/usePagedList';
import VerificationDrawer from '../admin/VerificationDrawer';
import { Completeness } from '../admin/VerificationPage';
import { CategoryLabel } from './PengelolaParts';
import RevisionDialog from './RevisionDialog';

const PAGE_SIZE = 8;
const TABS = [
  { value: 'menunggu', label: 'Menunggu Verifikasi' },
  { value: 'perbaikan', label: 'Perlu Perbaikan Data' },
  { value: 'disetujui', label: 'Terverifikasi' },
  { value: 'ditolak', label: 'Ditolak' },
];
const SORT_OPTIONS = [
  { value: 'terlama', label: 'Terlama menunggu' },
  { value: 'terbaru', label: 'Terbaru' },
  { value: 'kelengkapan', label: 'Data paling lengkap' },
];
const SORTERS = {
  terlama: (a, b) => new Date(a.registeredAt) - new Date(b.registeredAt),
  terbaru: (a, b) => new Date(b.registeredAt) - new Date(a.registeredAt),
  kelengkapan: (a, b) => completeness(b) - completeness(a),
};

function Waiting({ since }) {
  return daysSince(since) >= 4 ? (
    <Badge tone="warning" icon={ClockIcon}>
      {formatWaiting(since)}
    </Badge>
  ) : (
    <span className="ad-strong">{formatWaiting(since)}</span>
  );
}

/** Verifikasi Profil & Validasi Data (desain Pengelola · Verifikasi + Perlu Perbaikan + Drawer). */
export default function PengelolaVerificationPage() {
  useDocumentTitle('Verifikasi Profil & Validasi Data');
  const { verifications, categories, approveProvider, rejectProvider, run, notify } = useAdmin();
  const { requestRevision } = usePengelolaActions();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(() =>
    TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'menunggu',
  );
  const [query, setQuery] = useState(params.get('cari') ?? '');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState('terlama');
  const [section, setSection] = useState('');
  const [resubmitted, setResubmitted] = useState('');
  const [dialog, setDialog] = useState(null);
  const headingRef = useRef(null);

  const selected = verifications.find((v) => v.id === params.get('tinjau')) ?? null;
  const categoryOf = (id) => categories.find((c) => c.id === id);
  const counts = Object.fromEntries(
    TABS.map(({ value }) => [value, verifications.filter((v) => v.status === value).length]),
  );
  const cityOptions = useMemo(
    () => [...new Set(verifications.map((v) => v.city))].sort(),
    [verifications],
  );

  const q = query.trim().toLowerCase();
  let rows = verifications
    .filter((v) => v.status === tab)
    .filter((v) => !q || v.name.toLowerCase().includes(q))
    .filter((v) => !category || v.category === category)
    .filter((v) => !city || v.city === city);
  if (tab === 'perbaikan') {
    rows = rows
      .filter((v) => !section || v.revision.sections.includes(section))
      .filter((v) => !resubmitted || v.revision.resubmitted === (resubmitted === 'sudah'))
      // Yang sudah dikirim ulang didahulukan, lalu yang paling lama menunggu.
      .sort(
        (a, b) =>
          Number(b.revision.resubmitted) - Number(a.revision.resubmitted) ||
          new Date(a.revision.requestedAt) - new Date(b.revision.requestedAt),
      );
  } else if (tab === 'menunggu') {
    rows = rows.sort(SORTERS[sort]);
  } else {
    rows = rows.sort((a, b) => new Date(b.decision?.at ?? 0) - new Date(a.decision?.at ?? 0));
  }
  const paging = usePagedList(rows, PAGE_SIZE);
  const filtered = Boolean(q || category || city || section || resubmitted);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };
  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setCity('');
    setSection('');
    setResubmitted('');
    paging.resetPage();
  };

  const openReview = (id) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tinjau', id);
      return next;
    });
  const closeReview = () =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('tinjau');
        return next;
      },
      { replace: true },
    );
  const finish = (message) => {
    setDialog(null);
    closeReview();
    notify(message);
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const subject = selected && {
    ...selected,
    meta: `${categoryOf(selected.category)?.name ?? '-'} · ${selected.city}`,
  };
  const selectedDone = selected ? completeness(selected) : 0;
  const missingSections = selected
    ? REVISION_SECTIONS.filter(
        (s) =>
          (s === 'Lokasi' && !selected.checklist.location) ||
          (s === 'Jadwal' && !selected.checklist.schedule) ||
          (s === 'Dokumen alumni' && !selected.checklist.alumni) ||
          (s === 'Portofolio' && !selected.checklist.portfolio) ||
          (s === 'Harga' && !selected.checklist.service),
      )
    : [];

  return (
    <>
      <PageHeader
        headingRef={headingRef}
        title="Verifikasi Profil & Validasi Data"
        lead="Tinjau pendaftaran dan perbaikan data alumni sebelum tampil di pencarian dan peta."
      />

      <section className="dash-card ad-list-card" aria-label="Verifikasi">
        <Tabs
          label="Status verifikasi"
          panelId="pg-verifikasi-panel"
          value={tab}
          onChange={(value) => {
            setTab(value);
            resetFilters();
          }}
          tabs={TABS.map((t) => ({ ...t, count: counts[t.value] }))}
        />
        <div
          id="pg-verifikasi-panel"
          role="tabpanel"
          aria-labelledby={`pg-verifikasi-panel-tab-${tab}`}
          className="ad-list-card__panel"
        >
          <div role="search" className="ad-filters">
            <SearchField
              label="Cari nama alumni"
              value={query}
              onChange={withReset(setQuery)}
              width={300}
            />
            {tab === 'perbaikan' ? (
              <>
                <FilterSelect
                  label="Bagian"
                  value={section}
                  onChange={withReset(setSection)}
                  options={[
                    { value: '', label: 'Semua' },
                    ...REVISION_SECTIONS.map((s) => ({ value: s, label: s })),
                  ]}
                />
                <FilterSelect
                  label="Dikirim ulang"
                  value={resubmitted}
                  onChange={withReset(setResubmitted)}
                  options={[
                    { value: '', label: 'Semua' },
                    { value: 'sudah', label: 'Sudah diperbarui' },
                    { value: 'belum', label: 'Belum diperbarui' },
                  ]}
                />
              </>
            ) : (
              <>
                <FilterSelect
                  label="Keahlian"
                  value={category}
                  onChange={withReset(setCategory)}
                  options={[
                    { value: '', label: 'Semua' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
                <FilterSelect
                  label="Kota"
                  value={city}
                  onChange={withReset(setCity)}
                  options={[
                    { value: '', label: 'Semua' },
                    ...cityOptions.map((c) => ({ value: c, label: c })),
                  ]}
                />
                {tab === 'menunggu' && (
                  <FilterSelect
                    label="Urutkan"
                    icon={FilterIcon}
                    value={sort}
                    onChange={withReset(setSort)}
                    options={SORT_OPTIONS}
                  />
                )}
              </>
            )}
          </div>

          {rows.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={ShieldCheckIcon}
                title="Tidak ada alumni untuk filter ini"
                action={
                  <button type="button" className="btn btn--primary" onClick={resetFilters}>
                    <ResetIcon size={18} />
                    Reset Filter
                  </button>
                }
              >
                Coba ubah kata kunci atau filter.
              </EmptyState>
            ) : (
              <EmptyState
                icon={ShieldCheckIcon}
                title={
                  tab === 'menunggu'
                    ? 'Tidak ada alumni yang menunggu verifikasi'
                    : `Belum ada data ${TABS.find((t) => t.value === tab).label.toLowerCase()}`
                }
              >
                {tab === 'menunggu' && 'Semua pendaftaran sudah ditinjau. Kerja bagus!'}
              </EmptyState>
            )
          ) : (
            <>
              <div className="dash-table-wrap">
                <table className="dash-table ad-table">
                  <caption className="visually-hidden">
                    {tab === 'perbaikan'
                      ? 'Alumni perlu perbaikan data'
                      : `Antrean verifikasi, ${TABS.find((t) => t.value === tab).label.toLowerCase()}`}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Alumni</th>
                      <th scope="col">Keahlian</th>
                      <th scope="col">Kota</th>
                      {tab === 'perbaikan' ? (
                        <>
                          <th scope="col">Tanggal Perbaikan</th>
                          <th scope="col">Lama Menunggu</th>
                          <th scope="col">Bagian yang diminta</th>
                          <th scope="col">Dikirim ulang?</th>
                        </>
                      ) : tab === 'menunggu' ? (
                        <>
                          <th scope="col">Tanggal Daftar</th>
                          <th scope="col">Lama Menunggu</th>
                          <th scope="col">Kelengkapan Data</th>
                        </>
                      ) : (
                        <>
                          <th scope="col">Tanggal Keputusan</th>
                          <th scope="col">Oleh</th>
                          <th scope="col">Kelengkapan Data</th>
                        </>
                      )}
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paging.pageItems.map((item) => {
                      const actionable =
                        tab === 'menunggu' || (tab === 'perbaikan' && item.revision?.resubmitted);
                      return (
                        <tr
                          key={item.id}
                          className={
                            tab === 'perbaikan' && item.revision.resubmitted
                              ? 'pg-row-ready'
                              : undefined
                          }
                        >
                          <td>
                            <PersonCell person={item} />
                          </td>
                          <td>
                            <CategoryLabel id={item.category} />
                          </td>
                          <td>{item.city}</td>
                          {tab === 'perbaikan' ? (
                            <>
                              <td className="ad-nowrap">{formatDate(item.revision.requestedAt)}</td>
                              <td>
                                <Waiting since={item.revision.requestedAt} />
                              </td>
                              <td>
                                <span className="pg-tags">
                                  {item.revision.sections.map((s) => (
                                    <span key={s} className="pg-tag">
                                      {s}
                                    </span>
                                  ))}
                                </span>
                              </td>
                              <td>
                                {item.revision.resubmitted ? (
                                  <Badge tone="success" icon={CheckIcon}>
                                    Sudah diperbarui
                                  </Badge>
                                ) : (
                                  <Badge tone="warning" icon={ClockIcon}>
                                    Belum diperbarui
                                  </Badge>
                                )}
                              </td>
                            </>
                          ) : tab === 'menunggu' ? (
                            <>
                              <td className="ad-nowrap">{formatDate(item.registeredAt)}</td>
                              <td>
                                <Waiting since={item.registeredAt} />
                              </td>
                              <td>
                                <Completeness item={item} />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="ad-nowrap">
                                {item.decision ? formatDate(item.decision.at) : '–'}
                              </td>
                              <td>{item.decision?.by ?? '–'}</td>
                              <td>
                                <Completeness item={item} />
                              </td>
                            </>
                          )}
                          <td>
                            <button
                              type="button"
                              className={`btn ad-btn-sm ${actionable ? 'btn--primary' : 'btn--outline'}`}
                              aria-haspopup="dialog"
                              aria-label={`${tab === 'disetujui' || tab === 'ditolak' ? 'Lihat' : 'Tinjau'} ${item.name}`}
                              onClick={() => openReview(item.id)}
                            >
                              {tab === 'disetujui' || tab === 'ditolak' ? 'Lihat' : 'Tinjau'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TableFooter paging={paging} noun="alumni" />
            </>
          )}
        </div>
      </section>

      <VerificationDrawer
        item={dialog ? null : selected}
        category={selected && categoryOf(selected.category)}
        onClose={closeReview}
        onApprove={() => setDialog('setujui')}
        onReject={() => setDialog('tolak')}
        onRequestRevision={() => setDialog('perbaikan')}
      />

      {selected && (
        <>
          <ReasonDialog
            open={dialog === 'setujui'}
            onClose={() => setDialog(null)}
            tone="success"
            icon={CheckCircleIcon}
            title="Setujui alumni?"
            description={
              selectedDone < CHECKLIST_ITEMS.length
                ? `Data belum lengkap (${selectedDone}/${CHECKLIST_ITEMS.length}). Profil tetap akan tampil di pencarian dan peta.`
                : 'Profil akan tampil di pencarian dan peta.'
            }
            subject={subject}
            required={false}
            label="Catatan"
            confirmLabel="Ya, Setujui"
            onConfirm={async (note) => {
              const name = selected.name;
              await run(() => approveProvider(selected.id, note));
              finish(`${name} terverifikasi. Aksi tercatat di Audit Log.`);
            }}
          />
          <ReasonDialog
            open={dialog === 'tolak'}
            onClose={() => setDialog(null)}
            tone="danger"
            icon={XCircleIcon}
            title="Tolak pendaftaran?"
            description="Alumni akan menerima notifikasi beserta alasan penolakan."
            subject={subject}
            quickReasons={REJECT_QUICK_REASONS}
            confirmLabel="Ya, Tolak"
            onConfirm={async (reason) => {
              const name = selected.name;
              await run(() => rejectProvider(selected.id, reason));
              finish(`Pendaftaran ${name} ditolak. Aksi tercatat di Audit Log.`);
            }}
          />
          <RevisionDialog
            open={dialog === 'perbaikan'}
            onClose={() => setDialog(null)}
            subject={subject}
            defaultSections={missingSections}
            onConfirm={async (sections, note) => {
              const name = selected.name;
              await run(() => requestRevision(selected.id, sections, note));
              setTab('perbaikan');
              finish(`Permintaan perbaikan dikirim ke ${name}. Tercatat di Audit Log.`);
            }}
          />
        </>
      )}
    </>
  );
}
