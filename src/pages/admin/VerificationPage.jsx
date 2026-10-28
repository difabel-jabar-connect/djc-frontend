import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  CheckCircleIcon,
  FilterIcon,
  ResetIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import {
  CHECKLIST_ITEMS,
  REJECT_QUICK_REASONS,
  VERIFICATION_STATUS,
  completeness,
} from '@/features/admin/adminData';
import { daysSince, formatDate, formatWaiting } from '@/features/admin/adminFormat';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ReasonDialog } from './AdminDialogs';
import {
  Badge,
  CategoryIcon,
  EmptyState,
  FilterSelect,
  PageHeader,
  PersonCell,
  SearchField,
  TableFooter,
  Tabs,
} from './AdminParts';
import { usePagedList } from './usePagedList';
import VerificationDrawer from './VerificationDrawer';

const PAGE_SIZE = 8;
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

function Completeness({ item }) {
  const done = completeness(item);
  const total = CHECKLIST_ITEMS.length;
  const level = done === total ? 'full' : done >= 4 ? 'mid' : 'low';
  return (
    <span className="ad-progress">
      <span
        role="progressbar"
        aria-valuenow={done}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Kelengkapan data ${done} dari ${total}`}
        className="ad-progress__track"
      >
        <span
          className={`ad-progress__bar ad-progress__bar--${level}`}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </span>
      <strong aria-hidden="true">
        {done}/{total}
      </strong>
    </span>
  );
}

/** Verifikasi Penyedia (desain Admin Verifikasi + Drawer Tinjau + dialog Setujui/Tolak). */
export default function VerificationPage() {
  useDocumentTitle('Verifikasi Penyedia');
  const { verifications, categories, approveProvider, rejectProvider, run, notify } = useAdmin();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(() =>
    params.get('tab') in VERIFICATION_STATUS ? params.get('tab') : 'menunggu',
  );
  const [query, setQuery] = useState(params.get('cari') ?? '');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [sort, setSort] = useState('terlama');
  const [dialog, setDialog] = useState(null);
  const headingRef = useRef(null);

  const selected = verifications.find((v) => v.id === params.get('tinjau')) ?? null;
  const categoryOf = (id) => categories.find((c) => c.id === id);

  const counts = Object.fromEntries(
    Object.keys(VERIFICATION_STATUS).map((key) => [
      key,
      verifications.filter((v) => v.status === key).length,
    ]),
  );
  const cityOptions = useMemo(
    () => [...new Set(verifications.map((v) => v.city))].sort(),
    [verifications],
  );

  const rows = verifications
    .filter((v) => v.status === tab)
    .filter((v) => !query.trim() || v.name.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((v) => !category || v.category === category)
    .filter((v) => !city || v.city === city)
    .sort(SORTERS[sort]);
  const paging = usePagedList(rows, PAGE_SIZE);
  const filtered = Boolean(query.trim() || category || city);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };

  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setCity('');
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

  return (
    <>
      <PageHeader
        headingRef={headingRef}
        title="Verifikasi Penyedia"
        lead="Tinjau dan validasi pendaftaran mitra alumni UPTD PPSGHD."
      />

      <section className="dash-card ad-list-card" aria-label="Daftar verifikasi">
        <Tabs
          label="Status pendaftaran"
          panelId="verifikasi-panel"
          value={tab}
          onChange={withReset(setTab)}
          tabs={Object.entries(VERIFICATION_STATUS).map(([value, meta]) => ({
            value,
            label: meta.short,
            count: counts[value],
          }))}
        />
        <div
          id="verifikasi-panel"
          role="tabpanel"
          aria-labelledby={`verifikasi-panel-tab-${tab}`}
          className="ad-list-card__panel"
        >
          <div role="search" className="ad-filters">
            <SearchField
              label="Cari nama penyedia"
              value={query}
              onChange={withReset(setQuery)}
              width={300}
            />
            <FilterSelect
              label="Kategori"
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
            <FilterSelect
              label="Urutkan"
              icon={FilterIcon}
              value={sort}
              onChange={withReset(setSort)}
              options={SORT_OPTIONS}
            />
          </div>

          {rows.length === 0 ? (
            filtered ? (
              <EmptyState
                icon={ShieldCheckIcon}
                title="Tidak ada penyedia untuk filter ini"
                action={
                  <button type="button" className="btn btn--primary" onClick={resetFilters}>
                    <ResetIcon size={18} />
                    Reset Filter
                  </button>
                }
              >
                Coba ubah kata kunci, kategori, atau kota.
              </EmptyState>
            ) : tab === 'menunggu' ? (
              <EmptyState
                icon={ShieldCheckIcon}
                title="Tidak ada penyedia yang menunggu verifikasi"
              >
                Semua pendaftaran sudah ditinjau. Kerja bagus!
              </EmptyState>
            ) : (
              <EmptyState
                icon={ShieldCheckIcon}
                title={`Belum ada pendaftaran ${VERIFICATION_STATUS[tab].short.toLowerCase()}`}
              />
            )
          ) : (
            <>
              <div className="dash-table-wrap">
                <table className="dash-table ad-table">
                  <caption className="visually-hidden">
                    Antrean verifikasi penyedia, {VERIFICATION_STATUS[tab].short.toLowerCase()}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Penyedia</th>
                      <th scope="col">Keahlian</th>
                      <th scope="col">Domisili</th>
                      <th scope="col">Tanggal Daftar</th>
                      <th scope="col">{tab === 'menunggu' ? 'Lama Menunggu' : 'Keputusan'}</th>
                      <th scope="col">Kelengkapan Data</th>
                      <th scope="col">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paging.pageItems.map((item) => {
                      const cat = categoryOf(item.category);
                      return (
                        <tr key={item.id}>
                          <td>
                            <PersonCell person={item} />
                          </td>
                          <td>
                            <span className="ad-skill">
                              <CategoryIcon icon={cat?.icon} size={18} />
                              {cat?.name ?? '-'}
                            </span>
                          </td>
                          <td>{item.city}</td>
                          <td className="ad-nowrap">{formatDate(item.registeredAt)}</td>
                          <td>
                            {tab === 'menunggu' ? (
                              daysSince(item.registeredAt) >= 5 ? (
                                <Badge tone="warning">{formatWaiting(item.registeredAt)}</Badge>
                              ) : (
                                <span className="ad-strong">
                                  {formatWaiting(item.registeredAt)}
                                </span>
                              )
                            ) : (
                              <span className="ad-stack">
                                <Badge tone={VERIFICATION_STATUS[item.status].tone}>
                                  {VERIFICATION_STATUS[item.status].short}
                                </Badge>
                                <span className="ad-sub">{formatDate(item.decision.at)}</span>
                              </span>
                            )}
                          </td>
                          <td>
                            <Completeness item={item} />
                          </td>
                          <td>
                            <button
                              type="button"
                              className={`btn ad-btn-sm ${tab === 'menunggu' ? 'btn--primary' : 'btn--outline'}`}
                              aria-haspopup="dialog"
                              aria-label={`${tab === 'menunggu' ? 'Tinjau' : 'Lihat'} pendaftaran ${item.name}`}
                              onClick={() => openReview(item.id)}
                            >
                              {tab === 'menunggu' ? 'Tinjau' : 'Lihat'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <TableFooter paging={paging} noun="penyedia" />
            </>
          )}
        </div>
      </section>

      <VerificationDrawer
        item={selected}
        category={selected && categoryOf(selected.category)}
        onClose={closeReview}
        onApprove={() => setDialog('setujui')}
        onReject={() => setDialog('tolak')}
      />

      {selected && (
        <>
          <ReasonDialog
            open={dialog === 'setujui'}
            onClose={() => setDialog(null)}
            tone="success"
            icon={CheckCircleIcon}
            title="Setujui penyedia?"
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
              finish(`${name} disetujui sebagai penyedia. Aksi tercatat di Audit Log.`);
            }}
          />
          <ReasonDialog
            open={dialog === 'tolak'}
            onClose={() => setDialog(null)}
            tone="danger"
            icon={XCircleIcon}
            title="Tolak pendaftaran?"
            description="Penyedia akan menerima notifikasi beserta alasan penolakan."
            subject={subject}
            quickReasons={REJECT_QUICK_REASONS}
            confirmLabel="Ya, Tolak"
            onConfirm={async (reason) => {
              const name = selected.name;
              await run(() => rejectProvider(selected.id, reason));
              finish(`Pendaftaran ${name} ditolak. Aksi tercatat di Audit Log.`);
            }}
          />
        </>
      )}
    </>
  );
}
