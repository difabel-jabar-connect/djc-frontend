import { useMemo, useState } from 'react';
import {
  AlertIcon,
  CheckIcon,
  CrosshairIcon,
  MapPinIcon,
  MinusIcon,
  SendIcon,
  SortIcon,
  ChevronDownIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDate } from '@/features/admin/adminFormat';
import {
  ALUMNI_STATUS,
  CATEGORY_COLORS,
  REGIONS,
  buildMapProviders,
  shapeCenter,
} from '@/features/pengelola/pengelolaData';
import { formatScore } from '@/features/pengelola/pengelolaFormat';
import { usePengelolaActions } from '@/features/pengelola/usePengelolaActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Badge,
  CategoryIcon,
  PageHeader,
  PersonCell,
  SearchField,
  TableFooter,
} from '../admin/AdminParts';
import { usePagedList } from '../admin/usePagedList';
import { CategoryLabel, SummaryTiles } from './PengelolaParts';
import RegionMap from './RegionMap';
import RevisionDialog from './RevisionDialog';

const PAGE_SIZE = 10;
const SORTABLE = [
  { key: 'name', label: 'Kota/Kabupaten', type: 'text' },
  { key: 'providers', label: 'Penyedia' },
  { key: 'services', label: 'Layanan Aktif' },
  { key: 'orders', label: 'Pesanan' },
  { key: 'rating', label: 'Rating Rata-rata' },
];

function Checkbox({ checked, onChange, children, count }) {
  return (
    <label className="pg-filter-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="pg-filter-check__label">{children}</span>
      <span className="pg-filter-check__count">{count}</span>
    </label>
  );
}

/** Sebaran Wilayah (desain Pengelola · Wilayah: Titik Penyedia & Kepadatan Pesanan). */
export default function RegionsPage() {
  useDocumentTitle('Sebaran Wilayah');
  const { alumni, categories, services, run, notify } = useAdmin();
  const { requestAlumniRevision } = usePengelolaActions();
  const [query, setQuery] = useState('');
  const [selectedCats, setSelectedCats] = useState(() =>
    categories.filter((c) => c.active).map((c) => c.id),
  );
  const [statuses, setStatuses] = useState(['terverifikasi', 'perbaikan']);
  const [layer, setLayer] = useState('titik');
  const [selection, setSelection] = useState(null);
  const [focusRequest, setFocusRequest] = useState(null);
  const [sort, setSort] = useState({ key: 'providers', dir: 'desc' });
  const [revising, setRevising] = useState(null);

  const mapProviders = useMemo(() => buildMapProviders(REGIONS, alumni), [alumni]);
  const noLocation = alumni.filter((a) => !a.coords);
  const reached = REGIONS.filter((r) => r.providers > 0).length;

  const q = query.trim().toLowerCase();
  const matchesStatus = (p) => statuses.includes(p.status);
  const matchesCategory = (p) => selectedCats.includes(p.category);
  const visible = mapProviders.filter((p) => matchesStatus(p) && matchesCategory(p));

  const regionMatch = (region) =>
    !q ||
    region.name.toLowerCase().includes(q) ||
    alumni.some((a) => a.city === region.name && a.coords && a.name.toLowerCase().includes(q));
  const dimmed = new Set(REGIONS.filter((r) => !regionMatch(r)).map((r) => r.id));

  const clusters = REGIONS.map((region) => ({
    region,
    count: visible.filter((p) => p.region === region.id && !p.alumni).length,
  })).filter((c) => c.count > 0 && !dimmed.has(c.region.id));

  const pins = visible
    .filter((p) => p.alumni)
    .map((p) => alumni.find((a) => a.id === p.alumni))
    .filter((a) => !q || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q))
    .map((a) => {
      const region = REGIONS.find((r) => r.name === a.city);
      const [x, y] = shapeCenter(region.shape);
      return {
        alumni: a,
        x: x + 30,
        y: y - 8,
        services: services.filter((s) => s.provider === a.id && s.status === 'aktif').length,
      };
    });

  const toggle = (list, setList, value) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const sorted = REGIONS.filter(regionMatch).sort((a, b) => {
    const meta = SORTABLE.find((s) => s.key === sort.key);
    const dir = sort.dir === 'asc' ? 1 : -1;
    if (meta.type === 'text') return a.name.localeCompare(b.name, 'id') * dir;
    return ((a[sort.key] ?? -1) - (b[sort.key] ?? -1)) * dir || a.name.localeCompare(b.name, 'id');
  });
  const paging = usePagedList(sorted, PAGE_SIZE);

  const sortBy = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'name' ? 'asc' : 'desc' },
    );
    paging.resetPage();
  };

  const focusRegion = (region) => {
    setSelection({ type: 'region', id: region.id });
    setFocusRequest({ id: region.id, at: Date.now() });
  };

  const confirmRevision = async (sections, note) => {
    const name = revising.name;
    await run(() => requestAlumniRevision(revising.id, sections, note));
    setRevising(null);
    notify(`Permintaan perbaikan data dikirim ke ${name}. Tercatat di Audit Log.`);
  };

  return (
    <>
      <PageHeader
        title="Sebaran Wilayah"
        lead="Pantau persebaran penyedia dan layanan di Jawa Barat."
      />

      <SummaryTiles
        label="Ringkasan wilayah"
        columns={3}
        items={[
          {
            label: 'Kota/Kabupaten Terjangkau',
            value: reached,
            suffix: `dari ${REGIONS.length}`,
            icon: MapPinIcon,
            tone: 'teal',
          },
          { label: 'Penyedia di Peta', value: mapProviders.length, icon: UsersIcon },
          {
            label: 'Penyedia Tanpa Titik Lokasi',
            value: noLocation.length,
            icon: AlertIcon,
            tone: 'orange',
          },
        ]}
      />

      <div className="pg-map-layout">
        <aside className="dash-card pg-map-filters" aria-label="Filter peta">
          <SearchField label="Cari kota atau nama penyedia" value={query} onChange={setQuery} />

          <fieldset className="pg-filter-group">
            <legend>
              <span>Filter Kategori</span>
              <span className="pg-filter-group__actions">
                <button
                  type="button"
                  className="ad-link-btn"
                  onClick={() => setSelectedCats(categories.map((c) => c.id))}
                >
                  Pilih semua
                </button>
                {' / '}
                <button type="button" className="ad-link-btn" onClick={() => setSelectedCats([])}>
                  Hapus semua
                </button>
              </span>
            </legend>
            {categories.map((c) => (
              <Checkbox
                key={c.id}
                checked={selectedCats.includes(c.id)}
                onChange={() => toggle(selectedCats, setSelectedCats, c.id)}
                count={mapProviders.filter((p) => p.category === c.id && matchesStatus(p)).length}
              >
                <CategoryIcon icon={c.icon} size={18} />
                <span
                  className="pg-dot"
                  style={{ background: CATEGORY_COLORS[c.id] ?? '#64748b' }}
                  aria-hidden="true"
                />
                {c.name}
              </Checkbox>
            ))}
          </fieldset>

          <fieldset className="pg-filter-group">
            <legend>
              <span>Status Penyedia</span>
            </legend>
            {Object.entries(ALUMNI_STATUS).map(([key, meta]) => (
              <Checkbox
                key={key}
                checked={statuses.includes(key)}
                onChange={() => toggle(statuses, setStatuses, key)}
                count={mapProviders.filter((p) => p.status === key && matchesCategory(p)).length}
              >
                {key === 'perbaikan' ? 'Perlu Perbaikan' : meta.label}
              </Checkbox>
            ))}
          </fieldset>

          <fieldset className="pg-filter-group">
            <legend>
              <span>Lapisan Peta</span>
            </legend>
            {[
              {
                value: 'titik',
                label: 'Titik Penyedia',
                hint: 'Pin per penyedia, digabung bila berdekatan',
              },
              {
                value: 'densitas',
                label: 'Kepadatan Pesanan',
                hint: 'Per kota/kabupaten, 5 tingkat',
              },
            ].map((option) => (
              <label key={option.value} className="pg-filter-radio">
                <input
                  type="radio"
                  name="lapisan-peta"
                  value={option.value}
                  checked={layer === option.value}
                  onChange={() => setLayer(option.value)}
                />
                <strong>{option.label}</strong>
                <span className="pg-filter-radio__hint">{option.hint}</span>
              </label>
            ))}
          </fieldset>
        </aside>

        <RegionMap
          layer={layer}
          regions={REGIONS}
          clusters={clusters}
          pins={pins}
          categories={categories}
          dimmed={dimmed}
          selection={selection}
          onSelect={setSelection}
          focusRequest={focusRequest}
        />
      </div>

      <section className="dash-card dash-panel ad-list-card" aria-labelledby="pg-seb-title">
        <div className="pg-section-head">
          <h2 id="pg-seb-title" className="pg-card__title">
            Sebaran per Kota/Kabupaten
          </h2>
          <span className="ad-hint">Pilih judul kolom untuk mengurutkan</span>
        </div>
        <div className="dash-table-wrap">
          <table className="dash-table ad-table">
            <caption className="visually-hidden">
              Sebaran penyedia per kota/kabupaten, diurutkan berdasarkan{' '}
              {SORTABLE.find((s) => s.key === sort.key).label.toLowerCase()}
            </caption>
            <thead>
              <tr>
                {SORTABLE.map((col) => {
                  const active = sort.key === col.key;
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={
                        active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                      }
                    >
                      <button
                        type="button"
                        className={`pg-sort${active ? ' is-active' : ''}`}
                        onClick={() => sortBy(col.key)}
                      >
                        {col.label}
                        {active ? (
                          <ChevronDownIcon
                            size={14}
                            strokeWidth={2.5}
                            className={sort.dir === 'asc' ? 'pg-sort__up' : undefined}
                            aria-hidden="true"
                          />
                        ) : (
                          <SortIcon size={14} aria-hidden="true" />
                        )}
                      </button>
                    </th>
                  );
                })}
                <th scope="col">Kategori Terbanyak</th>
                <th scope="col">
                  <span className="visually-hidden">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {paging.pageItems.map((region) => (
                <tr key={region.id} className={region.providers ? undefined : 'pg-row-muted'}>
                  <td>
                    <span className="pg-region-name">
                      <strong>{region.name}</strong>
                      {!region.providers && (
                        <Badge tone="neutral" icon={MinusIcon}>
                          Belum terjangkau
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td>
                    <strong>{region.providers}</strong>
                  </td>
                  <td>{region.services}</td>
                  <td>{region.orders}</td>
                  <td>{formatScore(region.rating)}</td>
                  <td>
                    {region.top ? (
                      <CategoryLabel id={region.top} />
                    ) : (
                      <span className="ad-muted-cell">–</span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="pg-icon-btn pg-icon-btn--sm"
                      aria-label={`Fokus di peta: ${region.name}`}
                      title="Fokus di peta"
                      onClick={() => focusRegion(region)}
                    >
                      <CrosshairIcon size={18} strokeWidth={2.25} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <TableFooter paging={paging} noun="kota/kabupaten" />
      </section>

      {noLocation.length > 0 && (
        <section className="pg-warn-card" aria-labelledby="pg-tt-title">
          <div className="pg-warn-card__head">
            <AlertIcon size={22} strokeWidth={2.25} />
            <div>
              <h2 id="pg-tt-title">Penyedia Tanpa Titik Lokasi ({noLocation.length})</h2>
              <p>Penyedia tanpa koordinat tidak muncul di peta dan pencarian sekitar.</p>
            </div>
          </div>
          <ul className="pg-warn-list">
            {noLocation.map((a) => (
              <li key={a.id}>
                <PersonCell
                  person={a}
                  secondary={
                    <>
                      {a.city} · <CategoryLabel id={a.category} />
                    </>
                  }
                />
                {a.revisionRequest ? (
                  <Badge tone="success" icon={CheckIcon}>
                    Diminta {formatDate(a.revisionRequest.at)}
                  </Badge>
                ) : (
                  <button
                    type="button"
                    className="btn btn--md pg-btn-orange-outline"
                    aria-haspopup="dialog"
                    aria-label={`Minta perbaikan data ${a.name}`}
                    onClick={() => setRevising(a)}
                  >
                    <SendIcon size={18} strokeWidth={2.25} />
                    Minta Perbaikan Data
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <RevisionDialog
        open={Boolean(revising)}
        onClose={() => setRevising(null)}
        subject={revising && { ...revising, meta: `${revising.city} · tanpa titik lokasi` }}
        defaultSections={['Lokasi']}
        onConfirm={confirmRevision}
      />
    </>
  );
}
