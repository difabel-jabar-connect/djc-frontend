import { useState } from 'react';
import { Link } from 'react-router';
import logoFooter from '@/assets/icons/logo-footer.svg';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { BarChart, DonutProgress, LineChart } from '@/components/dashboard/charts';
import { PanelHead, StatCard, StatusBadge, Trend } from '@/components/dashboard/DashboardWidgets';
import {
  AlertIcon,
  BagIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  ClockSmallIcon,
  DashboardIcon,
  DownloadIcon,
  GraduationIcon,
  MapIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  QuoteIcon,
  ReportIcon,
  SettingsIcon,
  ShieldCheckIcon,
  XIcon,
} from '@/components/ui/icons';
import {
  ADMIN_USER,
  ALUMNI_PER_MONTH,
  LATEST_ALUMNI,
  LATEST_SERVICES,
  MONTHS,
  ORDERS_PER_MONTH,
  PERIOD,
  PROGRAM_STATS,
  SERVICE_MAP_CITIES,
  TARGET,
  VERIFICATION,
} from '@/features/dashboard/adminDashboardData';
import { getCategory } from '@/features/search/catalog';
import { JABAR_BORDERS, JABAR_OUTLINE } from '@/features/map/jabarOutline';
import { downloadCsv } from '@/lib/csv';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS } from '@/routes/paths';
import './adminDashboard.css';

const number = new Intl.NumberFormat('id-ID');
const fmt = (value) => number.format(value);
const lastIndex = (series) => series.reduce((acc, value, i) => (value == null ? acc : i), -1);
/** Label sumbu X: tiap 2 bulan (Jan, Mar, Mei, …). */
const EVERY_OTHER_MONTH = MONTHS.map((month, i) => (i % 2 === 0 ? month : ''));

const NAV_ITEMS = [
  { label: 'Ringkasan', icon: DashboardIcon, href: '#ringkasan', current: true },
  { label: 'Data Alumni', icon: GraduationIcon, href: '#alumni' },
  { label: 'Data Layanan', icon: BriefcaseIcon, href: '#layanan' },
  { label: 'Pesanan', icon: BagIcon, href: '#aktivitas-pesanan' },
  { label: 'Wilayah', icon: MapIcon, href: '#wilayah' },
  {
    label: 'Verifikasi',
    icon: ShieldCheckIcon,
    href: '#verifikasi',
    badge: VERIFICATION.pending,
    badgeTone: 'warning',
    badgeLabel: 'menunggu',
  },
  { label: 'Laporan', icon: ReportIcon, href: '#capaian' },
  { label: 'Pengaturan', icon: SettingsIcon },
];

const STATUS = {
  aktif: { tone: 'success', label: 'Aktif', icon: CheckIcon },
  verifikasi: { tone: 'warning', label: 'Verifikasi', icon: ClockSmallIcon },
};

function SidebarArt() {
  return (
    <svg width="196" height="76" viewBox="0 0 196 76" aria-hidden="true" focusable="false">
      <circle cx="40" cy="24" r="12" fill="#fff" />
      <path d="M0 76 C30 48 60 56 90 40 C120 24 160 34 196 18 V76 Z" fill="#c9e3f2" />
      <path
        d="M0 76 C40 60 80 66 120 52 C150 42 176 46 196 40 V76 Z"
        fill="#14a3a3"
        opacity="0.35"
      />
      <g
        fill="none"
        stroke="#0b3c6e"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M112 76 V48 L126 40 L140 48 V76" />
        <path d="M122 76 V64 H130 V76" />
        <path d="M146 76 V36 H160 V76" />
        <path d="M150 44 H156 M150 52 H156 M150 60 H156" />
        <path d="M166 76 V54 H184 V76" />
      </g>
      <path d="M0 75 H196" stroke="#0b3c6e" strokeWidth="2" />
      <path
        d="M78 14 L79.5 18.5 L84 20 L79.5 21.5 L78 26 L76.5 21.5 L72 20 L76.5 18.5 Z"
        fill="#14a3a3"
      />
    </svg>
  );
}

function ServiceMap() {
  const [zoom, setZoom] = useState(1);
  const cities = SERVICE_MAP_CITIES.map((c) => c.city);
  return (
    <div className="mini-map dash-map">
      <div className="mini-map__viewport">
        <svg
          className="mini-map__svg"
          viewBox="0 0 640 490"
          role="img"
          aria-label={`Peta Jawa Barat dengan titik layanan di ${cities.slice(0, -1).join(', ')}, dan ${cities.at(-1)}`}
          style={{ transform: `scale(${zoom})` }}
        >
          <path
            d={JABAR_OUTLINE}
            transform="translate(6 10)"
            fill="#c9e3f2"
            stroke="#c9e3f2"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <path
            d={JABAR_OUTLINE}
            fill="#fff"
            stroke="#fff"
            strokeWidth="10"
            strokeLinejoin="round"
          />
          <g
            fill="none"
            stroke="#b6d4e8"
            strokeWidth="3"
            strokeDasharray="9 10"
            strokeLinecap="round"
          >
            {JABAR_BORDERS.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g stroke="#fff" strokeWidth="5">
            {SERVICE_MAP_CITIES.map(({ city, x, y, primary }) => (
              <g key={city} transform={`translate(${x} ${y})`}>
                <path
                  d="M0 0 C-3 -9 -20 -20 -20 -38 A20 20 0 1 1 20 -38 C20 -20 3 -9 0 0 Z"
                  fill={primary ? '#0c7272' : '#14a3a3'}
                />
                <circle cx="0" cy="-38" r="7" fill="#fff" stroke="none" />
              </g>
            ))}
          </g>
        </svg>
      </div>
      <div className="mini-map__zoom">
        <button
          type="button"
          aria-label="Perbesar peta"
          onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
          disabled={zoom >= 2}
        >
          <PlusIcon />
        </button>
        <button
          type="button"
          aria-label="Perkecil peta"
          onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
          disabled={zoom <= 1}
        >
          <MinusIcon />
        </button>
      </div>
    </div>
  );
}

function downloadReport() {
  const rows = [
    ['Laporan Program Difabel Jabar Connect', PERIOD.label],
    [],
    ['Indikator', 'Nilai', 'Perubahan dari bulan lalu'],
    ['Alumni aktif', PROGRAM_STATS.alumni.value, PROGRAM_STATS.alumni.trend],
    ['Layanan aktif', PROGRAM_STATS.services.value, PROGRAM_STATS.services.trend],
    ['Total pesanan', PROGRAM_STATS.orders.value, PROGRAM_STATS.orders.trend],
    ['Kota terjangkau', PROGRAM_STATS.cities.value, PROGRAM_STATS.cities.trend],
    [],
    ['Bulan', 'Alumni aktif', 'Pesanan'],
    ...MONTHS.map((month, i) => [month, ALUMNI_PER_MONTH[i] ?? '', ORDERS_PER_MONTH[i] ?? '']),
    [],
    ['Verifikasi', 'Jumlah'],
    ['Menunggu verifikasi', VERIFICATION.pending],
    ['Perlu perbaikan data', VERIFICATION.needsFix],
    ['Terverifikasi', VERIFICATION.verified],
    ['Ditolak', VERIFICATION.rejected],
  ];
  downloadCsv(`laporan-program-${PERIOD.year}.csv`, rows);
}

/** Dashboard Monitoring Program untuk Pengelola UPTD PPSGHD (FR-ADM-*). Data contoh. */
export default function AdminDashboardPage() {
  useDocumentTitle('Dashboard Pengelola');
  const alumniLast = lastIndex(ALUMNI_PER_MONTH);
  const ordersLast = lastIndex(ORDERS_PER_MONTH);
  const ordersPrev = ORDERS_PER_MONTH[ordersLast - 1];
  const ordersGrowth = Math.round(((ORDERS_PER_MONTH[ordersLast] - ordersPrev) / ordersPrev) * 100);
  const percent = Math.round((TARGET.achieved / TARGET.goal) * 100);
  const pendingMonths = `${MONTHS[alumniLast + 1]}–${MONTHS.at(-1)}`;

  const verificationRows = [
    {
      label: 'Menunggu Verifikasi',
      value: VERIFICATION.pending,
      tone: 'warning',
      icon: ClockSmallIcon,
    },
    {
      label: 'Perlu Perbaikan Data',
      value: VERIFICATION.needsFix,
      tone: 'orange',
      icon: AlertIcon,
    },
    { label: 'Terverifikasi', value: VERIFICATION.verified, tone: 'success', icon: CheckIcon },
    { label: 'Ditolak', value: VERIFICATION.rejected, tone: 'danger', icon: XIcon },
  ];

  return (
    <DashboardShell
      subtitle="Panel Pengelola UPTD PPSGHD"
      navLabel="Menu pengelola"
      navItems={NAV_ITEMS}
      user={ADMIN_USER}
      notifications={{ count: 5, href: '#verifikasi' }}
      sidebarNote={{ text: 'Kesempatan yang Setara, Manfaat untuk Semua', art: <SidebarArt /> }}
      footer={
        <footer className="dash-footer">
          <div className="dash-footer__brand">
            <img src={logoFooter} alt="" width="36" height="36" />
            <span>
              <strong>Difabel Jabar Connect</strong>
              <span>Talenta Difabel, untuk Jawa Barat yang Lebih Inklusif</span>
            </span>
          </div>
          <nav aria-label="Tautan footer" className="dash-footer__links">
            <Link to={PATHS.about}>UPTD PPSGHD Jawa Barat</Link>
            <Link to={`${PATHS.about}#kontak`}>Bantuan</Link>
            <Link to={`${PATHS.about}#privasi`}>Kebijakan Privasi</Link>
            <Link to={`${PATHS.about}#syarat`}>Syarat &amp; Ketentuan</Link>
          </nav>
          <p>© {PERIOD.year} Difabel Jabar Connect</p>
        </footer>
      }
    >
      <div id="ringkasan" className="dash-header">
        <div>
          <p className="dash-header__eyebrow">Selamat datang, {ADMIN_USER.firstName}</p>
          <h1 className="dash-header__title">Dashboard Monitoring Program</h1>
          <p className="dash-header__lead">
            Pantau perkembangan layanan, alumni, dan dampak program Difabel Jabar Connect.
          </p>
        </div>
        <div className="dash-header__actions">
          <p className="dash-period">
            <CalendarIcon className="dash-period__icon" />
            <span className="visually-hidden">Periode data: </span>
            {PERIOD.label}
          </p>
          <button
            type="button"
            className="btn btn--outline dash-header__button"
            onClick={downloadReport}
          >
            <DownloadIcon />
            Unduh Laporan
          </button>
        </div>
      </div>

      <section aria-label="Ringkasan program" className="admin-stats">
        <StatCard
          label="Alumni Aktif"
          icon={GraduationIcon}
          value={fmt(PROGRAM_STATS.alumni.value)}
        >
          <Trend value={PROGRAM_STATS.alumni.trend} />
        </StatCard>
        <StatCard
          label="Layanan Aktif"
          icon={BriefcaseIcon}
          tone="teal"
          value={fmt(PROGRAM_STATS.services.value)}
        >
          <Trend value={PROGRAM_STATS.services.trend} />
        </StatCard>
        <StatCard
          label="Total Pesanan"
          icon={BagIcon}
          tone="amber"
          value={fmt(PROGRAM_STATS.orders.value)}
        >
          <Trend value={PROGRAM_STATS.orders.trend} />
        </StatCard>
        <StatCard
          label="Kota Terjangkau"
          icon={MapPinIcon}
          tone="green"
          value={fmt(PROGRAM_STATS.cities.value)}
        >
          <Trend value={PROGRAM_STATS.cities.trend} />
        </StatCard>
        <figure className="admin-quote">
          <QuoteIcon size={26} className="admin-quote__icon" />
          <blockquote>
            Setiap angka di sini adalah alumni yang berdaya. Data membantu kita membuka lebih banyak
            kesempatan.
          </blockquote>
        </figure>
      </section>

      <div className="admin-charts">
        <section id="wilayah" className="dash-card dash-panel" aria-labelledby="peta-title">
          <PanelHead id="peta-title" title="Sebaran Layanan di Jawa Barat">
            <Link to={PATHS.map} className="dash-panel__link">
              Lihat Detail →
            </Link>
          </PanelHead>
          <ServiceMap />
          <span className="pill">
            <MapPinIcon size={16} />
            {fmt(PROGRAM_STATS.services.value)} Penyedia Layanan di Seluruh Jawa Barat
          </span>
          <p className="dash-panel__note">{SERVICE_MAP_CITIES.map((c) => c.city).join(' · ')}</p>
        </section>

        <section
          id="alumni-chart"
          className="dash-card dash-panel"
          aria-labelledby="alumni-chart-title"
        >
          <PanelHead id="alumni-chart-title" title="Pertumbuhan Profil Alumni Aktif" />
          <p className="dash-panel__figure">
            <strong>{fmt(ALUMNI_PER_MONTH[alumniLast])}</strong> alumni aktif per{' '}
            {MONTHS[alumniLast]} {PERIOD.year}
          </p>
          <figure className="dash-chart">
            <LineChart
              data={ALUMNI_PER_MONTH}
              min={1000}
              max={2500}
              ticks={[1000, 1500, 2000, 2500]}
              tickFormat={(v) =>
                v % 1000 ? `${String(v / 1000).replace('.', ',')}rb` : `${v / 1000}rb`
              }
              labels={EVERY_OTHER_MONTH}
              ariaLabel={`Alumni aktif per bulan ${PERIOD.year}: ${MONTHS.slice(0, alumniLast + 1)
                .map((m, i) => `${m} ${fmt(ALUMNI_PER_MONTH[i])}`)
                .join(', ')}`}
              callout={{
                title: `${MONTHS[alumniLast]} ${PERIOD.year}`,
                value: `${fmt(ALUMNI_PER_MONTH[alumniLast])} alumni aktif`,
                width: 134,
              }}
            />
            <figcaption>
              Naik dari {fmt(ALUMNI_PER_MONTH[0])} ({MONTHS[0]}) menjadi{' '}
              {fmt(ALUMNI_PER_MONTH[alumniLast])} ({MONTHS[alumniLast]}). {pendingMonths} belum ada
              data.
            </figcaption>
          </figure>
        </section>

        <section
          id="aktivitas-pesanan"
          className="dash-card dash-panel"
          aria-labelledby="pesanan-chart-title"
        >
          <PanelHead id="pesanan-chart-title" title="Aktivitas Pesanan Layanan" />
          <p className="dash-panel__figure">
            <strong>{fmt(PROGRAM_STATS.orders.value)}</strong> pesanan {MONTHS[0]}–
            {MONTHS[ordersLast]} {PERIOD.year}
          </p>
          <figure className="dash-chart">
            <BarChart
              data={ORDERS_PER_MONTH}
              max={200}
              ticks={[0, 50, 100, 150, 200]}
              labels={EVERY_OTHER_MONTH}
              ariaLabel={`Pesanan per bulan ${PERIOD.year}: ${MONTHS.slice(0, ordersLast + 1)
                .map((m, i) => `${m} ${ORDERS_PER_MONTH[i]}`)
                .join(', ')}`}
              callout={{
                title: `${MONTHS[ordersLast]} ${PERIOD.year}`,
                value: `${ORDERS_PER_MONTH[ordersLast]} pesanan`,
                width: 112,
              }}
            />
            <figcaption>
              Tertinggi {MONTHS[ordersLast]}: {ORDERS_PER_MONTH[ordersLast]} pesanan, naik{' '}
              {ordersGrowth}% dari {MONTHS[ordersLast - 1]} ({ordersPrev}). {pendingMonths} belum
              ada data.
            </figcaption>
          </figure>
        </section>
      </div>

      <div className="admin-tables">
        <section
          id="alumni"
          className="dash-card dash-panel dash-panel--table"
          aria-labelledby="alumni-title"
        >
          <PanelHead id="alumni-title" title="Alumni Terbaru" />
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Nama · Domisili</th>
                  <th scope="col">Keahlian</th>
                  <th scope="col">Status</th>
                  <th scope="col">Tgl Daftar</th>
                </tr>
              </thead>
              <tbody>
                {LATEST_ALUMNI.map((alumni) => {
                  const status = STATUS[alumni.status];
                  return (
                    <tr key={alumni.name}>
                      <td>
                        <span className="dash-person">
                          <span
                            className="dash-avatar dash-avatar--sm"
                            style={{ backgroundColor: alumni.color }}
                            aria-hidden="true"
                          >
                            {alumni.initials}
                          </span>
                          <span>
                            <strong>{alumni.name}</strong>
                            <span className="dash-muted">{alumni.city}</span>
                          </span>
                        </span>
                      </td>
                      <td>{alumni.skill}</td>
                      <td>
                        <StatusBadge tone={status.tone} icon={status.icon}>
                          {status.label}
                        </StatusBadge>
                      </td>
                      <td className="dash-muted">{alumni.joined}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="layanan"
          className="dash-card dash-panel dash-panel--table"
          aria-labelledby="layanan-title"
        >
          <PanelHead id="layanan-title" title="Layanan Terbaru" />
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  <th scope="col">Layanan · Kategori</th>
                  <th scope="col">Penyedia</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {LATEST_SERVICES.map((service) => {
                  const status = STATUS[service.status];
                  return (
                    <tr key={service.title}>
                      <td>
                        <span className="dash-person">
                          <span className="dash-service-icon" aria-hidden="true">
                            <img
                              src={getCategory(service.slug)?.icon}
                              alt=""
                              width="18"
                              height="18"
                            />
                          </span>
                          <span>
                            <strong>{service.title}</strong>
                            <span className="dash-muted">{service.category}</span>
                          </span>
                        </span>
                      </td>
                      <td>{service.provider}</td>
                      <td>
                        <StatusBadge tone={status.tone} icon={status.icon}>
                          {status.label}
                        </StatusBadge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="admin-side">
          <section id="verifikasi" className="dash-card dash-panel" aria-labelledby="verif-title">
            <PanelHead id="verif-title" title="Verifikasi Profil & Validasi Data" />
            <ul className="verif-list">
              {verificationRows.map(({ label, value, tone, icon: Icon }) => (
                <li key={label}>
                  <span className={`verif-list__icon verif-list__icon--${tone}`} aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <span className="verif-list__label">{label}</span>
                  <strong className={`verif-list__value verif-list__value--${tone}`}>
                    {fmt(value)}
                  </strong>
                </li>
              ))}
            </ul>
          </section>

          <section id="capaian" className="dash-card dash-panel" aria-labelledby="capaian-title">
            <PanelHead id="capaian-title" title="Capaian Program" />
            <div className="target">
              <DonutProgress percent={percent} label={`Capaian ${percent} persen dari target`} />
              <div className="target__text">
                <span>{TARGET.label}</span>
                <strong>{fmt(TARGET.goal)} alumni aktif</strong>
                <span>Tercapai {fmt(TARGET.achieved)}</span>
              </div>
            </div>
            <p className="target__note">
              “Tinggal {fmt(TARGET.goal - TARGET.achieved)} alumni lagi menuju target tahun ini.”
            </p>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
