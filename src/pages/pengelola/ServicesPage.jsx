import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { BriefcaseIcon, EyeIcon, EyeOffIcon, ResetIcon, WalletIcon } from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDate } from '@/features/admin/adminFormat';
import { PRICE_RANGES, SERVICE_STATUS } from '@/features/pengelola/pengelolaData';
import { formatScore } from '@/features/pengelola/pengelolaFormat';
import { usePengelolaActions } from '@/features/pengelola/usePengelolaActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatRupiah } from '@/lib/format';
import { ReasonDialog } from '../admin/AdminDialogs';
import {
  Badge,
  CategoryIcon,
  EmptyState,
  FilterSelect,
  PageHeader,
  PersonCell,
  SearchField,
  TableFooter,
} from '../admin/AdminParts';
import { usePagedList } from '../admin/usePagedList';
import { CsvButton, RatingCell, ServiceTabs } from './PengelolaParts';
import ServiceDrawer from './ServiceDrawer';

const PAGE_SIZE = 10;
const HIDE_REASONS = ['Konten menyesatkan', 'Melanggar hak cipta', 'Harga tidak wajar'];

/** Data Layanan · Daftar (desain Pengelola · Data Layanan + Drawer Detail). */
export default function ServicesPage() {
  useDocumentTitle('Data Layanan');
  const { services, alumni, categories, run, notify } = useAdmin();
  const { hideService, showService } = usePengelolaActions();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('cari') ?? '');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [price, setPrice] = useState('');
  const [dialog, setDialog] = useState(null); // 'hide' | 'show'
  const headingRef = useRef(null);

  const ownerOf = (s) => alumni.find((a) => a.id === s.provider);
  const categoryOf = (id) => categories.find((c) => c.id === id);
  const cities = useMemo(
    () => [...new Set(services.map((s) => ownerOf(s)?.city).filter(Boolean))].sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [services, alumni],
  );

  const q = query.trim().toLowerCase();
  const base = services
    .filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (ownerOf(s)?.name ?? '').toLowerCase().includes(q),
    )
    .filter((s) => !city || ownerOf(s)?.city === city)
    .filter((s) => !status || s.status === status)
    .filter((s) => !price || PRICE_RANGES.find((r) => r.value === price).test(s.price));
  const rows = base
    .filter((s) => !category || s.category === category)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const paging = usePagedList(rows, PAGE_SIZE);
  const filtered = Boolean(q || category || city || status || price);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };
  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setCity('');
    setStatus('');
    setPrice('');
    paging.resetPage();
  };

  const selected = services.find((s) => s.id === params.get('lihat')) ?? null;
  const openService = (id) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set('lihat', id);
        else next.delete('lihat');
        return next;
      },
      { replace: true },
    );

  const confirm = async (reason) => {
    const name = selected.name;
    if (dialog === 'hide') await run(() => hideService(selected.id, reason));
    else await run(() => showService(selected.id, reason));
    setDialog(null);
    notify(
      dialog === 'hide'
        ? `Layanan ${name} disembunyikan dari pencarian. Tercatat di Audit Log.`
        : `Layanan ${name} tampil kembali. Tercatat di Audit Log.`,
    );
  };

  const chips = [
    { value: '', label: 'Semua', count: base.length },
    ...categories.map((c) => ({
      value: c.id,
      label: c.name,
      icon: c.icon,
      count: base.filter((s) => s.category === c.id).length,
    })),
  ];

  return (
    <>
      <PageHeader
        headingRef={headingRef}
        title="Data Layanan"
        lead="Pantau layanan yang ditawarkan alumni dan kelola kategorinya."
      >
        <CsvButton
          filename="data-layanan"
          noun="layanan"
          columns={[
            'Layanan',
            'Kategori',
            'Penyedia',
            'Harga',
            'Kota',
            'Rating',
            'Pesanan',
            'Status',
            'Diperbarui',
          ]}
          rows={rows.map((s) => [
            s.name,
            categoryOf(s.category)?.name ?? '–',
            ownerOf(s)?.name ?? '–',
            `${formatRupiah(s.price)}/${s.unit}`,
            ownerOf(s)?.city ?? '–',
            formatScore(s.rating),
            s.orders,
            SERVICE_STATUS[s.status].label,
            formatDate(s.updatedAt),
          ])}
        />
      </PageHeader>

      <ServiceTabs />

      <div role="group" aria-label="Filter kategori" className="pg-cat-chips">
        {chips.map((chip) => (
          <button
            key={chip.value || 'semua'}
            type="button"
            className="pg-cat-chip"
            aria-pressed={category === chip.value}
            onClick={() => withReset(setCategory)(chip.value)}
          >
            {chip.icon && <CategoryIcon icon={chip.icon} size={18} />}
            {chip.label}
            <span className="pg-cat-chip__count">{chip.count}</span>
          </button>
        ))}
      </div>

      <section className="dash-card dash-panel ad-list-card" aria-label="Daftar layanan">
        <div role="search" className="ad-filters">
          <SearchField
            label="Cari nama layanan atau penyedia"
            value={query}
            onChange={withReset(setQuery)}
            width={300}
          />
          <FilterSelect
            label="Kota"
            value={city}
            onChange={withReset(setCity)}
            options={[
              { value: '', label: 'Semua' },
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={withReset(setStatus)}
            options={[
              { value: '', label: 'Semua' },
              ...Object.entries(SERVICE_STATUS).map(([value, meta]) => ({
                value,
                label: meta.label,
              })),
            ]}
          />
          <FilterSelect
            label="Harga"
            icon={WalletIcon}
            value={price}
            onChange={withReset(setPrice)}
            options={PRICE_RANGES.map(({ value, label }) => ({ value, label }))}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={BriefcaseIcon}
            title="Tidak ada layanan untuk filter ini"
            action={
              filtered && (
                <button type="button" className="btn btn--primary" onClick={resetFilters}>
                  <ResetIcon size={18} />
                  Reset Filter
                </button>
              )
            }
          >
            Coba ubah kata kunci, kategori, atau harga.
          </EmptyState>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table ad-table pg-alumni-table">
                <caption className="visually-hidden">Daftar layanan</caption>
                <thead>
                  <tr>
                    <th scope="col">Layanan</th>
                    <th scope="col">Penyedia</th>
                    <th scope="col">Harga</th>
                    <th scope="col">Kota</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Pesanan</th>
                    <th scope="col">Status</th>
                    <th scope="col">Diperbarui</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paging.pageItems.map((s) => {
                    const owner = ownerOf(s);
                    const cat = categoryOf(s.category);
                    const meta = SERVICE_STATUS[s.status];
                    return (
                      <tr
                        key={s.id}
                        className={s.status === 'disembunyikan' ? 'pg-row-muted' : undefined}
                      >
                        <td>
                          <span className="pg-service">
                            <span className="pg-service-icon" aria-hidden="true">
                              <CategoryIcon icon={cat?.icon} size={18} />
                            </span>
                            <span className="ad-person__text">
                              <strong>{s.name}</strong>
                              <span>{cat?.name}</span>
                            </span>
                          </span>
                        </td>
                        <td>{owner && <PersonCell person={owner} size={32} />}</td>
                        <td>
                          <span className="pg-price-cell">
                            <strong className="pg-price">{formatRupiah(s.price)}</strong>
                            <span>/{s.unit}</span>
                          </span>
                        </td>
                        <td>{owner?.city}</td>
                        <td>
                          <RatingCell rating={s.rating} count={s.reviews} />
                        </td>
                        <td>
                          <strong>{s.orders}</strong>
                        </td>
                        <td>
                          <Badge
                            tone={meta.tone}
                            icon={s.status === 'disembunyikan' ? EyeOffIcon : undefined}
                          >
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="ad-muted-cell ad-nowrap">{formatDate(s.updatedAt)}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn--outline ad-btn-sm"
                            aria-haspopup="dialog"
                            aria-label={`Lihat detail layanan ${s.name}`}
                            onClick={() => openService(s.id)}
                          >
                            Lihat
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter paging={paging} noun="layanan" />
          </>
        )}
      </section>

      <ServiceDrawer
        service={dialog ? null : selected}
        category={selected && categoryOf(selected.category)}
        provider={selected && ownerOf(selected)}
        onClose={() => openService(null)}
        onHide={() => setDialog('hide')}
        onShow={() => setDialog('show')}
      />

      <ReasonDialog
        open={Boolean(dialog && selected)}
        onClose={() => setDialog(null)}
        tone={dialog === 'hide' ? 'danger' : 'success'}
        icon={dialog === 'hide' ? EyeOffIcon : EyeIcon}
        title={dialog === 'hide' ? 'Sembunyikan layanan ini?' : 'Tampilkan layanan lagi?'}
        description={
          dialog === 'hide'
            ? 'Layanan tidak tampil di pencarian dan peta sampai ditampilkan lagi. Penyedia menerima pemberitahuan.'
            : 'Layanan kembali tampil di pencarian dan peta.'
        }
        subject={
          selected && {
            name: selected.name,
            initials: <CategoryIcon icon={categoryOf(selected.category)?.icon} size={20} />,
            color: '#0c7272',
            meta: `${ownerOf(selected)?.name ?? '–'} · ${formatRupiah(selected.price)}/${selected.unit}`,
          }
        }
        quickReasons={dialog === 'hide' ? HIDE_REASONS : []}
        label={dialog === 'hide' ? 'Alasan' : 'Catatan'}
        confirmLabel={dialog === 'hide' ? 'Sembunyikan' : 'Tampilkan Lagi'}
        onConfirm={confirm}
      />
    </>
  );
}
