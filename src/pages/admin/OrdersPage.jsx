import { useMemo, useState } from 'react';
import { CalendarIcon, ClipboardListIcon, InfoIcon, ResetIcon } from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import {
  DATE_RANGE_OPTIONS,
  formatDate,
  formatSchedule,
  inDateRange,
} from '@/features/admin/adminFormat';
import { BOOKING_STATUS } from '@/features/booking/customerBookings';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Badge,
  EmptyState,
  FilterSelect,
  PageHeader,
  SearchField,
  TableFooter,
} from './AdminParts';
import OrderDrawer from './OrderDrawer';
import { useInitialParam, usePagedList } from './usePagedList';

const PAGE_SIZE = 10;

/** Monitoring Pesanan (desain Monitoring Pesanan + Drawer Detail). Admin hanya memantau. */
export default function OrdersPage() {
  useDocumentTitle('Monitoring Pesanan');
  const { orders, categories } = useAdmin();
  const initialStatus = useInitialParam('status');
  const initialQuery = useInitialParam('cari');
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus in BOOKING_STATUS ? initialStatus : '');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [range, setRange] = useState('');
  const [openCode, setOpenCode] = useState(null);

  const categoryName = (id) => categories.find((c) => c.id === id)?.name;
  const cities = useMemo(() => [...new Set(orders.map((o) => o.city))].sort(), [orders]);
  const sorted = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders],
  );

  const q = query.trim().toLowerCase();
  const rows = sorted
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
    .filter((o) => inDateRange(o.createdAt, range));
  const paging = usePagedList(rows, PAGE_SIZE);
  const filtered = Boolean(q || status || category || city || range);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };
  const resetFilters = () => {
    setQuery('');
    setStatus('');
    setCategory('');
    setCity('');
    setRange('');
    paging.resetPage();
  };

  const opened = orders.find((o) => o.code === openCode) ?? null;

  return (
    <>
      <PageHeader
        title="Monitoring Pesanan"
        lead="Pantau seluruh pesanan di platform secara real-time."
        readOnly
      />

      <p className="ad-info ad-info--bordered" role="note">
        <InfoIcon size={20} />
        Admin hanya dapat memantau. Status pesanan diubah oleh pengguna dan penyedia.
      </p>

      <ul className="ad-summary" aria-label="Ringkasan status pesanan">
        {Object.entries(BOOKING_STATUS).map(([key, meta]) => (
          <li key={key} className="dash-card">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <strong>{orders.filter((o) => o.status === key).length}</strong>
          </li>
        ))}
      </ul>

      <section className="dash-card dash-panel ad-list-card" aria-label="Daftar pesanan">
        <div role="search" className="ad-filters">
          <SearchField
            label="Cari kode, pengguna, atau penyedia"
            value={query}
            onChange={withReset(setQuery)}
            width={300}
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
            label="Tanggal"
            icon={CalendarIcon}
            value={range}
            onChange={withReset(setRange)}
            options={DATE_RANGE_OPTIONS}
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
            Coba ubah kode pesanan, status, atau tanggal.
          </EmptyState>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table ad-table">
                <caption className="visually-hidden">
                  Daftar pesanan, pilih kode pesanan untuk melihat detail
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Kode</th>
                    <th scope="col">Pengguna</th>
                    <th scope="col">Penyedia</th>
                    <th scope="col">Layanan</th>
                    <th scope="col">Jadwal</th>
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
                        <td>{order.provider}</td>
                        <td>{order.service}</td>
                        <td className="ad-nowrap">{formatSchedule(order.start)}</td>
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
