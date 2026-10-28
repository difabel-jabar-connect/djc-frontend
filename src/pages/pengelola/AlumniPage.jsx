import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  AlertIcon,
  CheckIcon,
  ClipboardListIcon,
  ClockIcon,
  GraduationIcon,
  BriefcaseIcon,
  MapIcon,
  ResetIcon,
  StarOutlineIcon,
  UsersIcon,
  XIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDate } from '@/features/admin/adminFormat';
import {
  ALUMNI_STATUS,
  PROFILE_FIELDS,
  PROGRAM_STATS,
  profileScore,
} from '@/features/pengelola/pengelolaData';
import { formatScore } from '@/features/pengelola/pengelolaFormat';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS, buildAlumniPath } from '@/routes/paths';
import {
  EmptyState,
  FilterSelect,
  PageHeader,
  PersonCell,
  SearchField,
  TableFooter,
} from '../admin/AdminParts';
import { useInitialParam, usePagedList } from '../admin/usePagedList';
import {
  AlumniStatusBadge,
  CategoryLabel,
  CsvButton,
  ProfileProgress,
  RatingCell,
  SummaryTiles,
} from './PengelolaParts';

const PAGE_SIZE = 10;
const RATING_OPTIONS = [
  { value: '', label: 'Semua' },
  { value: '4.5', label: '4,5 ke atas' },
  { value: '4', label: '4,0 ke atas' },
];

/** Data Alumni (desain Pengelola · Data Alumni). */
export default function AlumniPage() {
  useDocumentTitle('Data Alumni');
  const { alumni, services, categories, verifications } = useAdmin();
  const [query, setQuery] = useState(useInitialParam('cari'));
  const [category, setCategory] = useState('');
  const [city, setCity] = useState(useInitialParam('kota'));
  const [status, setStatus] = useState('');
  const [minRating, setMinRating] = useState('');

  const activeServices = (id) =>
    services.filter((s) => s.provider === id && s.status === 'aktif').length;
  const categoryName = (id) => categories.find((c) => c.id === id)?.name ?? '–';
  const cities = useMemo(
    () => [...new Set([...alumni.map((a) => a.city), city].filter(Boolean))].sort(),
    [alumni, city],
  );

  const q = query.trim().toLowerCase();
  const rows = alumni
    .filter((a) => !q || a.name.toLowerCase().includes(q))
    .filter((a) => !category || a.category === category)
    .filter((a) => !city || a.city === city)
    .filter((a) => !status || a.status === status)
    .filter((a) => !minRating || (a.rating ?? 0) >= Number(minRating))
    .sort((a, b) => b.completed - a.completed);
  const paging = usePagedList(rows, PAGE_SIZE);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };
  const resetFilters = () => {
    setQuery('');
    setCategory('');
    setCity('');
    setStatus('');
    setMinRating('');
    paging.resetPage();
  };

  const chips = [
    q && { key: 'cari', label: `Nama: ${query.trim()}`, clear: () => withReset(setQuery)('') },
    category && {
      key: 'keahlian',
      label: `Keahlian: ${categoryName(category)}`,
      clear: () => withReset(setCategory)(''),
    },
    city && { key: 'kota', label: `Kota/Kabupaten: ${city}`, clear: () => withReset(setCity)('') },
    status && {
      key: 'status',
      label: `Status: ${ALUMNI_STATUS[status].label}`,
      clear: () => withReset(setStatus)(''),
    },
    minRating && {
      key: 'rating',
      label: `Rating minimal: ${RATING_OPTIONS.find((o) => o.value === minRating).label}`,
      clear: () => withReset(setMinRating)(''),
    },
  ].filter(Boolean);

  const csvRows = rows.map((a) => [
    a.name,
    categoryName(a.category),
    a.city,
    activeServices(a.id),
    formatScore(a.rating),
    a.reviewCount,
    a.completed,
    `${profileScore(a)}/${PROFILE_FIELDS.length}`,
    ALUMNI_STATUS[a.status].label,
    formatDate(a.joinedAt),
  ]);

  return (
    <>
      <PageHeader title="Data Alumni" lead="Kelola dan pantau profil alumni penyedia layanan.">
        <CsvButton
          filename="data-alumni"
          noun="alumni"
          columns={[
            'Nama',
            'Keahlian',
            'Kota/Kabupaten',
            'Layanan Aktif',
            'Rating',
            'Jumlah Ulasan',
            'Pesanan Selesai',
            'Kelengkapan Profil',
            'Status',
            'Tanggal Daftar',
          ]}
          rows={csvRows}
        />
      </PageHeader>

      <SummaryTiles
        label="Ringkasan data alumni"
        columns={5}
        items={[
          { label: 'Total Terdaftar', value: PROGRAM_STATS.registered, icon: UsersIcon },
          {
            label: 'Terverifikasi',
            value: PROGRAM_STATS.verified,
            icon: CheckIcon,
            tone: 'success',
          },
          {
            label: 'Punya Layanan Aktif',
            value: PROGRAM_STATS.withActiveService,
            icon: BriefcaseIcon,
            tone: 'teal',
          },
          {
            label: 'Menunggu Verifikasi',
            value: verifications.filter((v) => v.status === 'menunggu').length,
            icon: ClockIcon,
            tone: 'warning',
          },
          {
            label: 'Perlu Perbaikan',
            value: verifications.filter((v) => v.status === 'perbaikan').length,
            icon: AlertIcon,
            tone: 'orange',
          },
        ]}
      />

      <section className="dash-card dash-panel ad-list-card" aria-label="Daftar alumni">
        <div role="search" className="ad-filters">
          <SearchField
            label="Cari nama alumni"
            value={query}
            onChange={withReset(setQuery)}
            width={260}
          />
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
            label="Kota/Kabupaten"
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
              ...Object.entries(ALUMNI_STATUS).map(([value, meta]) => ({
                value,
                label: meta.label,
              })),
            ]}
          />
          <FilterSelect
            label="Rating minimal"
            icon={StarOutlineIcon}
            value={minRating}
            onChange={withReset(setMinRating)}
            options={RATING_OPTIONS}
          />
          <div role="group" aria-label="Tampilan data" className="pg-view-toggle">
            <Link to={PATHS.pengelolaAlumni} aria-current="page">
              <ClipboardListIcon size={18} />
              Tabel
            </Link>
            <Link to={PATHS.pengelolaRegions}>
              <MapIcon size={18} />
              Peta
            </Link>
          </div>
        </div>

        {chips.length > 0 && (
          <div className="pg-chips">
            <span className="pg-chips__label">Filter aktif:</span>
            {chips.map((chip) => (
              <span key={chip.key} className="pg-chip">
                {chip.label}
                <button
                  type="button"
                  aria-label={`Hapus filter ${chip.label}`}
                  onClick={chip.clear}
                >
                  <XIcon size={16} strokeWidth={2.5} />
                </button>
              </span>
            ))}
            <button type="button" className="ad-link-btn pg-reset" onClick={resetFilters}>
              <ResetIcon size={16} />
              Reset Filter
            </button>
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={GraduationIcon}
            title="Tidak ada alumni untuk filter ini"
            action={
              <button type="button" className="btn btn--primary" onClick={resetFilters}>
                <ResetIcon size={18} />
                Reset Filter
              </button>
            }
          >
            Coba ubah nama, keahlian, atau kota.
          </EmptyState>
        ) : (
          <>
            <div className="dash-table-wrap">
              <table className="dash-table ad-table pg-alumni-table">
                <caption className="visually-hidden">Data alumni</caption>
                <thead>
                  <tr>
                    <th scope="col">Alumni</th>
                    <th scope="col">Keahlian</th>
                    <th scope="col">Layanan Aktif</th>
                    <th scope="col">Rating (ulasan)</th>
                    <th scope="col">Pesanan Selesai</th>
                    <th scope="col">Kelengkapan Profil</th>
                    <th scope="col">Status</th>
                    <th scope="col">Tgl Daftar</th>
                    <th scope="col">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paging.pageItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <PersonCell person={item} secondary={item.city} />
                      </td>
                      <td>
                        <CategoryLabel id={item.category} />
                      </td>
                      <td>
                        <strong>{activeServices(item.id)}</strong>
                      </td>
                      <td>
                        <RatingCell rating={item.rating} count={item.reviewCount} />
                      </td>
                      <td>
                        <strong>{item.completed}</strong>
                      </td>
                      <td className="pg-progress-cell">
                        <ProfileProgress alumni={item} />
                      </td>
                      <td>
                        <AlumniStatusBadge status={item.status} />
                      </td>
                      <td className="ad-muted-cell ad-nowrap">{formatDate(item.joinedAt)}</td>
                      <td>
                        <Link
                          to={buildAlumniPath(item.id)}
                          className="btn btn--outline ad-btn-sm"
                          aria-label={`Lihat detail ${item.name}`}
                        >
                          Lihat
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableFooter paging={paging} noun="alumni" />
          </>
        )}
      </section>
    </>
  );
}
