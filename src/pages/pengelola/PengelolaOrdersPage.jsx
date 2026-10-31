import { useMemo, useRef, useState } from 'react';
import {
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  InfoIcon,
  ResetIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDate, formatSchedule, hoursSince } from '@/features/admin/adminFormat';
import { BOOKING_STATUS } from '@/features/booking/customerBookings';
import { REPORT_PERIODS } from '@/features/pengelola/pengelolaData';
import { formatPeriod, inPeriod } from '@/features/pengelola/pengelolaFormat';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatRupiah } from '@/lib/format';
import {
  Badge,
  CategoryIcon,
  EmptyState,
  FilterSelect,
  PageHeader,
  SearchField,
  TableFooter,
} from '../admin/AdminParts';
import OrderDrawer from '../admin/OrderDrawer';
import { useInitialParam, usePagedList } from '../admin/usePagedList';
import { CsvButton } from './PengelolaParts';

const PAGE_SIZE = 10;
const STATUS_COLORS = {
  menunggu: '#d97706',
  diterima: '#2563eb',
  berjalan: '#14a3a3',
  selesai: '#16a34a',
  ditolak: '#dc2626',
  dibatalkan: '#6b7280',
};
const PERIODS = REPORT_PERIODS.filter((p) => p.from);
const LATE_HOURS = 20;

function StatusDonut({ counts, total, ariaLabel }) {
  const r = 71;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="170" height="170" viewBox="0 0 170 170" role="img" aria-label={ariaLabel}>
      <circle cx="85" cy="85" r={r} fill="none" stroke="#eef0f3" strokeWidth="22" />
      {total > 0 &&
        Object.entries(counts).map(([key, value]) => {
          if (!value) return null;
          const length = (value / total) * circumference;
          const gap = Object.values(counts).filter(Boolean).length > 1 ? 2 : 0;
          const segment = (
            <circle
              key={key}
              cx="85"
              cy="85"
              r={r}
              fill="none"
              stroke={STATUS_COLORS[key]}
              strokeWidth="22"
              strokeDasharray={`${Math.max(length - gap, 0.5)} ${circumference}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 85 85)"
            />
          );
          offset += length;
          return segment;
        })}
      <text x="85" y="88" textAnchor="middle" className="pg-donut__value">
        {total}
      </text>
      <text x="85" y="108" textAnchor="middle" className="pg-donut__label">
        pesanan
      </text>
    </svg>
  );
}

/** Data Pesanan (desain Pengelola · Data Pesanan + Drawer Detail). Hanya baca. */
export default function PengelolaOrdersPage() {
  useDocumentTitle('Data Pesanan');
  const { orders, categories, alumni } = useAdmin();
  const tableRef = useRef(null);
  const [period, setPeriod] = useState('tahun');
  const [query, setQuery] = useState(useInitialParam('cari'));
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [provider, setProvider] = useState('');
  const [openCode, setOpenCode] = useState(null);

  const range = PERIODS.find((p) => p.value === period);
  const inRange = useMemo(
    () =>
      orders
        .filter((o) => inPeriod(o.createdAt, range.from, range.to))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders, range],
  );
  const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? '–';
  const cities = [...new Set(inRange.map((o) => o.city))].sort();
  const providers = [...new Set(inRange.map((o) => o.provider))].sort();

  const counts = Object.fromEntries(
    Object.keys(BOOKING_STATUS).map((key) => [key, inRange.filter((o) => o.status === key).length]),
  );
  const total = inRange.length;
  const late = inRange.filter(
    (o) => o.status === 'menunggu' && hoursSince(o.createdAt) > LATE_HOURS,
  ).length;
  const byCategory = categories
    .map((c) => ({ ...c, count: inRange.filter((o) => o.category === c.id).length }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
  const topCategory = byCategory[0];
  const percent = (n) => (total ? Math.round((n / total) * 100) : 0);

  const q = query.trim().toLowerCase();
  const rows = inRange
    .filter(
      (o) =>
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.customer.toLowerCase().includes(q) ||
        o.provider.toLowerCase().includes(q),
    )
    .filter((o) => !status || o.status === status)
    .filter((o) => !category || o.category === category)
    .filter((o) => !city || o.city === city)
    .filter((o) => !provider || o.provider === provider);
  const paging = usePagedList(rows, PAGE_SIZE);
  const filtered = Boolean(q || status || category || city || provider);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };
  const resetFilters = () => {
    setQuery('');
    setStatus('');
    setCategory('');
    setCity('');
    setProvider('');
    paging.resetPage();
  };
  const showLate = () => {
    resetFilters();
    setStatus('menunggu');
    requestAnimationFrame(() => {
      tableRef.current?.scrollIntoView?.({ block: 'start' });
      tableRef.current?.focus();
    });
  };

  const opened = orders.find((o) => o.code === openCode) ?? null;
  const providerOf = (name) => alumni.find((a) => a.name === name);

  return (
    <>
      <PageHeader title="Data Pesanan" lead="Pantau seluruh pesanan di platform." readOnly>
        <FilterSelect
          label="Periode"
          icon={CalendarIcon}
          value={period}
          onChange={withReset(setPeriod)}
          options={PERIODS.map((p) => ({
            value: p.value,
            label: `${p.label} (${formatPeriod(p.from, p.to)})`,
          }))}
        />
        <CsvButton
          filename={`data-pesanan-${period}`}
          noun="pesanan"
          columns={[
            'Kode',
            'Pengguna',
            'Penyedia',
            'Layanan',
            'Kategori',
            'Jadwal',
            'Estimasi',
            'Status',
            'Dibuat',
          ]}
          rows={rows.map((o) => [
            o.code,
            o.customer,
            o.provider,
            o.service,
            categoryName(o.category),
            formatSchedule(o.start),
            formatRupiah(o.unitPrice * o.qty),
            BOOKING_STATUS[o.status].label,
            formatDate(o.createdAt),
          ])}
        />
      </PageHeader>

      <p className="ad-info ad-info--bordered" role="note">
        <InfoIcon size={20} />
        Pengelola hanya memantau. Status pesanan diubah oleh pengguna, penyedia, atau sistem.
      </p>

      <ul className="ad-summary" aria-label="Pesanan per status">
        {Object.entries(BOOKING_STATUS).map(([key, meta]) => (
          <li key={key} className="dash-card">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <strong>{counts[key]}</strong>
          </li>
        ))}
      </ul>

      {late > 0 && (
        <div className="pg-alert" role="alert">
          <ClockIcon size={22} strokeWidth={2.25} />
          <span>
            <strong>
              {late} pesanan Menunggu lebih dari {LATE_HOURS} jam
            </strong>{' '}
            — akan dibatalkan otomatis oleh Sistem pada batas 24 jam.
          </span>
          <button type="button" className="ad-link-btn pg-alert__link" onClick={showLate}>
            Lihat →
          </button>
        </div>
      )}

      <div className="pg-chart-grid">
        <section className="dash-card dash-panel" aria-labelledby="pg-ch-cat">
          <h2 id="pg-ch-cat" className="pg-card__title">
            Pesanan per Kategori
          </h2>
          {byCategory.length ? (
            <>
              <ul
                className="pg-bars"
                role="img"
                aria-label={`Pesanan per kategori: ${byCategory.map((c) => `${c.name} ${c.count}`).join(', ')}`}
              >
                {byCategory.map((c) => (
                  <li key={c.id}>
                    <span className="pg-bars__label">
                      <CategoryIcon icon={c.icon} size={16} />
                      {c.name}
                    </span>
                    <span className="pg-bars__track">
                      <span style={{ width: `${(c.count / topCategory.count) * 100}%` }} />
                    </span>
                    <strong>{c.count}</strong>
                  </li>
                ))}
              </ul>
              <p className="pg-chart-note">
                {topCategory.name} paling banyak dipesan pada periode ini ({topCategory.count} dari{' '}
                {total} pesanan).
              </p>
            </>
          ) : (
            <p className="ad-muted-text">Belum ada pesanan pada periode ini.</p>
          )}
        </section>

        <section className="dash-card dash-panel" aria-labelledby="pg-ch-status">
          <h2 id="pg-ch-status" className="pg-card__title">
            Pesanan per Status
          </h2>
          <div className="pg-donut">
            <StatusDonut
              counts={counts}
              total={total}
              ariaLabel={`Pesanan per status: ${Object.entries(BOOKING_STATUS)
                .map(([key, meta]) => `${meta.label} ${counts[key]}`)
                .join(', ')}`}
            />
            <ul className="pg-legend">
              {Object.entries(BOOKING_STATUS).map(([key, meta]) => (
                <li key={key}>
                  <span
                    className="pg-legend__swatch"
                    style={{ background: STATUS_COLORS[key] }}
                    aria-hidden="true"
                  />
                  <span className="pg-legend__label">{meta.label}</span>
                  <strong>{counts[key]}</strong>
                  <span className="pg-legend__pct">{percent(counts[key])}%</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="pg-chart-note">
            {percent(counts.selesai)}% pesanan periode ini sudah Selesai; {counts.dibatalkan}{' '}
            dibatalkan ({percent(counts.dibatalkan)}%).
          </p>
        </section>
      </div>

      <section
        ref={tableRef}
        tabIndex={-1}
        className="dash-card dash-panel ad-list-card"
        aria-label="Daftar pesanan"
      >
        <div role="search" className="ad-filters">
          <SearchField
            label="Cari kode pesanan"
            value={query}
            onChange={withReset(setQuery)}
            width={240}
          />
          <FilterSelect
            label="Status"
            value={status}
            onChange={withReset(setStatus)}
            options={[
              { value: '', label: 'Semua' },
              ...Object.entries(BOOKING_STATUS).map(([value, meta]) => ({
                value,
                label: meta.label,
              })),
            ]}
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
              ...cities.map((c) => ({ value: c, label: c })),
            ]}
          />
          <FilterSelect
            label="Penyedia"
            value={provider}
            onChange={withReset(setProvider)}
            options={[
              { value: '', label: 'Semua' },
              ...providers.map((p) => ({ value: p, label: p })),
            ]}
          />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={ClipboardListIcon}
            title="Tidak ada pesanan untuk filter ini"
            action={
              filtered && (
                <button type="button" className="btn btn--primary" onClick={resetFilters}>
                  <ResetIcon size={18} />
                  Reset Filter
                </button>
              )
            }
          >
            Coba ubah kode pesanan, status, atau periode.
          </EmptyState>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table ad-table">
                <caption className="visually-hidden">
                  Daftar pesanan, pilih kode untuk melihat detail
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Kode</th>
                    <th scope="col">Pengguna</th>
                    <th scope="col">Penyedia</th>
                    <th scope="col">Layanan</th>
                    <th scope="col">Jadwal</th>
                    <th scope="col">Estimasi</th>
                    <th scope="col">Status</th>
                    <th scope="col">Dibuat</th>
                  </tr>
                </thead>
                <tbody>
                  {paging.pageItems.map((order) => {
                    const meta = BOOKING_STATUS[order.status];
                    return (
                      <tr key={order.code}>
                        <td>
                          <button
                            type="button"
                            className="ad-link-btn ad-code"
                            aria-haspopup="dialog"
                            aria-label={`Detail pesanan ${order.code}`}
                            onClick={() => setOpenCode(order.code)}
                          >
                            {order.code}
                          </button>
                        </td>
                        <td>{order.customer}</td>
                        <td>{providerOf(order.provider)?.name ?? order.provider}</td>
                        <td>{order.service}</td>
                        <td className="ad-nowrap">{formatSchedule(order.start)}</td>
                        <td className="ad-nowrap">
                          <strong>{formatRupiah(order.unitPrice * order.qty)}</strong>
                        </td>
                        <td>
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                        </td>
                        <td className="ad-muted-cell ad-nowrap">{formatDate(order.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <TableFooter paging={paging} noun="pesanan" />
          </>
        )}
      </section>

      <OrderDrawer
        order={opened}
        categoryName={opened && categoryName(opened.category)}
        onClose={() => setOpenCode(null)}
      />
    </>
  );
}
