import { useId, useState } from 'react';
import { BarChart, DonutProgress, LineChart } from '@/components/dashboard/charts';
import {
  BriefcaseIcon,
  CalendarIcon,
  ChartLineIcon,
  ClipboardListIcon,
  DownloadIcon,
  FileTextIcon,
  GraduationIcon,
  MapIcon,
  SpinnerIcon,
  StarOutlineIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDateTime } from '@/features/admin/adminFormat';
import {
  MONTHLY_ORDERS,
  RATING_DISTRIBUTION,
  REGIONS,
  REPORT_PERIODS,
  REPORT_TYPES,
} from '@/features/pengelola/pengelolaData';
import {
  buildPdf,
  downloadFile,
  formatPeriod,
  formatPeriodLong,
  slugFile,
  toCsv,
} from '@/features/pengelola/pengelolaFormat';
import { programKpis, reportLines, reportTable } from '@/features/pengelola/reportData';
import { usePengelolaActions } from '@/features/pengelola/usePengelolaActions';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Badge, FilterSelect, PageHeader } from '../admin/AdminParts';
import { FieldError } from '../admin/FormFields';

const TYPE_ICONS = {
  chart: ChartLineIcon,
  graduation: GraduationIcon,
  briefcase: BriefcaseIcon,
  clipboard: ClipboardListIcon,
  star: StarOutlineIcon,
  map: MapIcon,
};
const FILTERABLE = ['alumni', 'layanan', 'pesanan', 'wilayah'];
const ROWS_PER_PAGE = 20;
const PREVIEW_ROWS = 12;
const MONTH_LABELS = ['Jan', '', 'Mar', '', 'Mei', '', 'Jul', '', 'Sep', 'Okt'];

function FormatBadge({ format }) {
  return (
    <Badge tone={format === 'pdf' ? 'danger' : 'success'} icon={FileTextIcon}>
      {format.toUpperCase()}
    </Badge>
  );
}

/** Pratinjau halaman pertama laporan Ringkasan Program. */
function SummaryPaper({ kpi, period, by, categories }) {
  const topCategories = [...categories].sort((a, b) => b.services - a.services).slice(0, 5);
  const topRegions = [...REGIONS].sort((a, b) => b.orders - a.orders).slice(0, 5);
  const unreached = REGIONS.filter((r) => !r.providers).map((r) =>
    r.name.replace(/^(Kab\.|Kota) /, ''),
  );
  return (
    <div
      className="pg-paper"
      role="img"
      aria-label={`Pratinjau Laporan Ringkasan Program ${formatPeriodLong(period.from, period.to)}: ${kpi.verified} alumni terverifikasi, ${kpi.activeServices} layanan aktif, ${kpi.totalOrders} pesanan, ${kpi.reached} dari ${kpi.regionCount} kota terjangkau, capaian target ${kpi.targetPercent} persen.`}
    >
      <div className="pg-paper__head">
        <strong>Laporan Ringkasan Program</strong>
        <span>
          Difabel Jabar Connect · UPTD PPSGHD Jawa Barat · {formatPeriod(period.from, period.to)} ·
          Dibuat oleh {by}
        </span>
      </div>
      <div className="pg-paper__kpis">
        {[
          ['Alumni terverifikasi', kpi.verified, '↑ 12%'],
          ['Layanan aktif', kpi.activeServices, '↑ 8%'],
          ['Total pesanan', kpi.totalOrders, '↑ 24%'],
          ['Kota terjangkau', `${kpi.reached}/${kpi.regionCount}`, '↑ 4 kota'],
        ].map(([label, value, trend]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <em>{trend}</em>
          </div>
        ))}
      </div>
      <div className="pg-paper__grid">
        <div>
          <b>Pesanan per bulan</b>
          <BarChart
            data={MONTHLY_ORDERS}
            max={200}
            ticks={[0, 100, 200]}
            labels={MONTH_LABELS}
            ariaLabel="Pesanan per bulan"
          />
        </div>
        <div>
          <b>Pertumbuhan pesanan kumulatif</b>
          <LineChart
            data={MONTHLY_ORDERS.map((_, i) =>
              MONTHLY_ORDERS.slice(0, i + 1).reduce((s, n) => s + n, 0),
            )}
            min={0}
            max={1000}
            ticks={[0, 500, 1000]}
            labels={MONTH_LABELS}
            ariaLabel="Pertumbuhan pesanan kumulatif"
          />
        </div>
      </div>
      <div className="pg-paper__grid">
        <div>
          <b>5 kategori teratas (layanan)</b>
          <table>
            <tbody>
              {topCategories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.services}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <b>Sebaran per kota (penyedia · pesanan)</b>
          <table>
            <tbody>
              {topRegions.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.providers}</td>
                  <td>{r.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="pg-paper__grid pg-paper__grid--wide">
        <div>
          <b>Distribusi rating 1–5</b>
          {[5, 4, 3, 2, 1].map((star) => (
            <span key={star} className="pg-paper__rating">
              <span>{star}★</span>
              <span className="pg-paper__track">
                <span style={{ width: `${RATING_DISTRIBUTION[star]}%` }} />
              </span>
              <span>{RATING_DISTRIBUTION[star]}%</span>
            </span>
          ))}
        </div>
        <div className="pg-paper__target">
          <b>Capaian target 2026</b>
          <span>
            <DonutProgress percent={kpi.targetPercent} size={70} label="Capaian target" />
            <span>
              {kpi.targetValue.toLocaleString('id-ID')} dari{' '}
              {kpi.targetGoal.toLocaleString('id-ID')} alumni aktif
              <br />
              Tinggal {(kpi.targetGoal - kpi.targetValue).toLocaleString('id-ID')} lagi
            </span>
          </span>
        </div>
      </div>
      <div className="pg-paper__note">
        <b>Sorotan</b>
        <ul>
          <li>
            Pesanan Oktober ({MONTHLY_ORDERS[9]}) naik{' '}
            {Math.round((MONTHLY_ORDERS[9] / MONTHLY_ORDERS[8] - 1) * 100)}% dari September,
            tertinggi sepanjang 2026.
          </li>
          <li>
            {unreached.length} kota/kabupaten belum terjangkau: {unreached.join(', ')}.
          </li>
        </ul>
      </div>
      <div className="pg-paper__foot">
        <span>Data per 28 Okt 2026, 18.00 WIB.</span>
        <span>Halaman 1 dari 1</span>
      </div>
    </div>
  );
}

function TablePaper({ type, table, period, by }) {
  const shown = table.rows.slice(0, PREVIEW_ROWS);
  return (
    <div className="pg-paper">
      <div className="pg-paper__head">
        <strong>{type.title}</strong>
        <span>
          Difabel Jabar Connect · UPTD PPSGHD Jawa Barat · {formatPeriod(period.from, period.to)} ·
          Dibuat oleh {by}
        </span>
      </div>
      {table.rows.length ? (
        <table className="pg-paper__table">
          <caption className="visually-hidden">Pratinjau {type.title}</caption>
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th key={col} scope="col">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.join('|')}>
                {row.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="pg-paper__empty">Tidak ada data untuk periode dan filter ini.</p>
      )}
      <div className="pg-paper__foot">
        <span>
          {table.rows.length > PREVIEW_ROWS
            ? `Pratinjau ${PREVIEW_ROWS} dari ${table.rows.length} baris.`
            : `${table.rows.length} baris.`}
        </span>
        <span>Halaman 1 dari {Math.max(1, Math.ceil(table.rows.length / ROWS_PER_PAGE))}</span>
      </div>
    </div>
  );
}

/** Laporan Program (desain Pengelola · Laporan): buat, pratinjau, unduh, dan riwayat. */
export default function ReportsPage() {
  useDocumentTitle('Laporan Program');
  const id = useId();
  const { alumni, services, orders, categories, reports, actor, run, notify } = useAdmin();
  const { createReport } = usePengelolaActions();
  const [type, setType] = useState('ringkasan');
  const [periodKey, setPeriodKey] = useState('tahun');
  const [custom, setCustom] = useState({ from: '2026-10-01', to: '2026-10-31' });
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [format, setFormat] = useState('pdf');
  const [busy, setBusy] = useState(false);

  const preset = REPORT_PERIODS.find((p) => p.value === periodKey);
  const period = periodKey === 'kustom' ? custom : { from: preset.from, to: preset.to };
  const periodError =
    periodKey === 'kustom' && (!custom.from || !custom.to || custom.from > custom.to)
      ? 'Tanggal mulai harus sebelum tanggal selesai.'
      : '';
  const filterable = FILTERABLE.includes(type);
  const typeMeta = REPORT_TYPES.find((t) => t.id === type);
  const source = { alumni, services, orders, categories, regions: REGIONS };
  const filters = filterable ? { category, city } : {};
  const table = reportTable(type, source, { ...period, ...filters });
  const kpi = programKpis(REGIONS);

  const exportReport = (report) => {
    const meta = REPORT_TYPES.find((t) => t.id === report.type);
    const data = reportTable(report.type, source, report);
    const name = slugFile(`${meta.title} ${formatPeriod(report.from, report.to)}`);
    return report.format === 'csv'
      ? downloadFile(`${name}.csv`, toCsv(data.columns, data.rows), 'text/csv;charset=utf-8')
      : downloadFile(
          `${name}.pdf`,
          buildPdf(meta.title, reportLines(report, data)),
          'application/pdf',
        );
  };

  const create = async () => {
    if (periodError || busy) return;
    setBusy(true);
    const report = await run(() =>
      createReport({ type, format, ...period, ...(filterable ? { category, city } : {}) }),
    );
    setBusy(false);
    exportReport(report);
    notify(
      `${typeMeta.title} (${format.toUpperCase()}) dibuat dan diunduh. Tercatat di Audit Log.`,
    );
  };

  return (
    <>
      <PageHeader title="Laporan Program" lead="Buat dan unduh laporan perkembangan program." />

      <div className="pg-report-layout">
        <section className="dash-card pg-card pg-report-form" aria-labelledby={`${id}-buat`}>
          <h2 id={`${id}-buat`} className="pg-card__title">
            Buat Laporan
          </h2>

          <fieldset className="ad-fieldset">
            <legend className="form-label">Jenis Laporan</legend>
            <div className="pg-type-list">
              {REPORT_TYPES.map((t) => {
                const Icon = TYPE_ICONS[t.icon];
                return (
                  <label key={t.id} className="pg-type">
                    <input
                      type="radio"
                      name={`${id}-jenis`}
                      value={t.id}
                      checked={type === t.id}
                      onChange={() => setType(t.id)}
                    />
                    <span className="pg-type__icon" aria-hidden="true">
                      <Icon size={18} />
                    </span>
                    <span className="pg-type__text">
                      <strong>{t.label}</strong>
                      <span>{t.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="ad-field">
            <span className="form-label" id={`${id}-periode`}>
              Periode
            </span>
            <div role="group" aria-labelledby={`${id}-periode`} className="pg-period-chips">
              {REPORT_PERIODS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className="pg-period-chip"
                  aria-pressed={periodKey === p.value}
                  onClick={() => setPeriodKey(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {periodKey === 'kustom' ? (
              <div className="pg-date-range">
                <label>
                  <span>Dari</span>
                  <input
                    type="date"
                    className="ad-text-input"
                    value={custom.from}
                    max={custom.to}
                    onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                    aria-invalid={Boolean(periodError)}
                  />
                </label>
                <label>
                  <span>Sampai</span>
                  <input
                    type="date"
                    className="ad-text-input"
                    value={custom.to}
                    min={custom.from}
                    onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                    aria-invalid={Boolean(periodError)}
                  />
                </label>
              </div>
            ) : (
              <p className="pg-period-value" aria-live="polite">
                <CalendarIcon size={20} />
                <span className="visually-hidden">Periode laporan: </span>
                {formatPeriod(period.from, period.to)}
              </p>
            )}
            <FieldError id={`${id}-periode-error`}>{periodError}</FieldError>
          </div>

          {filterable && (
            <div className="ad-field">
              <span className="form-label">
                Filter <span className="form-label__optional">(opsional)</span>
              </span>
              <div className="pg-report-filters">
                <FilterSelect
                  label="Kategori"
                  value={category}
                  onChange={setCategory}
                  options={[
                    { value: '', label: 'Semua' },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
                <FilterSelect
                  label="Kota/Kabupaten"
                  value={city}
                  onChange={setCity}
                  options={[
                    { value: '', label: 'Semua' },
                    ...REGIONS.map((r) => ({ value: r.name, label: r.name })),
                  ]}
                />
              </div>
            </div>
          )}

          <fieldset className="ad-fieldset">
            <legend className="form-label">Format</legend>
            <div className="pg-segment">
              {['pdf', 'csv'].map((f) => (
                <label key={f}>
                  <input
                    type="radio"
                    name={`${id}-format`}
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                  />
                  <span>
                    <FileTextIcon size={18} />
                    {f.toUpperCase()}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            className="btn btn--primary btn--md pg-block-btn"
            onClick={create}
            disabled={busy || Boolean(periodError)}
            aria-busy={busy || undefined}
          >
            {busy ? <SpinnerIcon className="ad-spin" size={18} /> : <FileTextIcon size={18} />}
            {busy ? 'Membuat laporan...' : 'Buat Laporan'}
          </button>
        </section>

        <section className="dash-card pg-card pg-preview" aria-labelledby={`${id}-prev`}>
          <div className="pg-card__head">
            <h2 id={`${id}-prev`} className="pg-card__title">
              Pratinjau
            </h2>
            <span className="ad-hint">
              {typeMeta.title} · {format.toUpperCase()} · A4
            </span>
          </div>
          <div className="pg-preview__stage">
            {type === 'ringkasan' ? (
              <SummaryPaper kpi={kpi} period={period} by={actor.name} categories={categories} />
            ) : (
              <TablePaper type={typeMeta} table={table} period={period} by={actor.name} />
            )}
          </div>
        </section>
      </div>

      <section className="dash-card dash-panel ad-list-card" aria-labelledby={`${id}-riw`}>
        <h2 id={`${id}-riw`} className="pg-card__title">
          Riwayat Laporan
        </h2>
        <div className="dash-table-wrap">
          <table className="dash-table ad-table">
            <caption className="visually-hidden">Riwayat laporan</caption>
            <thead>
              <tr>
                <th scope="col">Nama Laporan</th>
                <th scope="col">Periode</th>
                <th scope="col">Format</th>
                <th scope="col">Dibuat oleh</th>
                <th scope="col">Waktu</th>
                <th scope="col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const meta = REPORT_TYPES.find((t) => t.id === report.type);
                const label = `${meta.title} ${formatPeriod(report.from, report.to)}`;
                return (
                  <tr key={report.id}>
                    <td>
                      <strong>{meta.title}</strong>
                    </td>
                    <td className="ad-nowrap">{formatPeriod(report.from, report.to)}</td>
                    <td>
                      <FormatBadge format={report.format} />
                    </td>
                    <td>{report.by}</td>
                    <td className="ad-muted-cell ad-nowrap">{formatDateTime(report.at)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--outline ad-btn-sm"
                        aria-label={`Unduh ${label}`}
                        onClick={() => {
                          exportReport(report);
                          notify(`${label} (${report.format.toUpperCase()}) diunduh.`);
                        }}
                      >
                        <DownloadIcon size={18} strokeWidth={2.25} />
                        Unduh
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
