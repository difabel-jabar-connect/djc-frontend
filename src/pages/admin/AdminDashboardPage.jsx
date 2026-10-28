import { useState } from 'react';
import { Link } from 'react-router';
import { StatCard, Trend } from '@/components/dashboard/DashboardWidgets';
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClipboardListIcon,
  ClockIcon,
  FlagIcon,
  ShapesIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { AUDIT_ACTIONS, ORDER_TREND, PLATFORM_STATS } from '@/features/admin/adminData';
import {
  formatDate,
  formatDateTime,
  formatDayMonth,
  formatWaiting,
  daysSince,
  hoursSince,
} from '@/features/admin/adminFormat';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS, buildAdminPath } from '@/routes/paths';
import { AuditActionIcon, Badge, CategoryIcon, FilterSelect, PersonCell } from './AdminParts';

const fmt = (value) => value.toLocaleString('id-ID');
const DAY = 24 * 60 * 60 * 1000;

function WelcomeArt() {
  return (
    <svg
      className="ad-welcome__art"
      width="210"
      height="140"
      viewBox="0 0 210 140"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="110" cy="70" r="62" fill="#fff" opacity="0.7" />
      <rect
        x="96"
        y="40"
        width="96"
        height="72"
        rx="12"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3"
      />
      <path
        d="M108 96 L126 80 L140 88 L176 58"
        fill="none"
        stroke="#14a3a3"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="108" y="100" width="10" height="6" rx="2" fill="#c9e3f2" />
      <rect x="124" y="96" width="10" height="10" rx="2" fill="#c9e3f2" />
      <rect x="140" y="92" width="10" height="14" rx="2" fill="#c9e3f2" />
      <path
        d="M60 26 C72 34 84 36 96 36 V68 C96 92 80 106 60 114 C40 106 24 92 24 68 V36 C36 36 48 34 60 26 Z"
        fill="#0b3c6e"
      />
      <path
        d="m46 70 10 10 20-20"
        fill="none"
        stroke="#fff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M186 18 L189 26 L197 28 L190 33 L192 41 L186 37 L180 41 L182 33 L175 28 L183 26 Z"
        fill="#14a3a3"
      />
      <circle cx="196" cy="120" r="5" fill="#b6d4e8" />
    </svg>
  );
}

/** Grafik area pesanan harian (SVG tanpa library) + teks alternatif lengkap. */
function TrendChart({ values, end }) {
  const width = 440;
  const height = 250;
  const [left, right, top, bottom] = [44, 424, 20, 200];
  const peak = Math.max(...values);
  // Puncak sumbu Y = kelipatan 4 berikutnya di atas nilai tertinggi (10 → 12).
  const maxTick = (Math.floor(peak / 4) + 1) * 4;
  const ticks = Array.from({ length: maxTick / 4 + 1 }, (_, i) => i * 4);
  const dateAt = (i) => new Date(new Date(end).getTime() - (values.length - 1 - i) * DAY);
  const x = (i) => left + (i * (right - left)) / Math.max(1, values.length - 1);
  const y = (v) => bottom - (v / maxTick) * (bottom - top);
  const line = values
    .map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(' ');
  const peakIndex = values.indexOf(peak);
  const total = values.reduce((sum, v) => sum + v, 0);
  const average = Math.round(total / values.length);
  const middle = Math.floor((values.length - 1) / 2);

  return (
    <figure className="ad-trend__figure">
      <svg
        className="chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Pesanan harian ${formatDate(dateAt(0))} sampai ${formatDate(dateAt(values.length - 1))}, rata-rata ${average} pesanan per hari, tertinggi ${peak} pesanan pada ${formatDayMonth(dateAt(peakIndex))}`}
      >
        <defs>
          <linearGradient id="ad-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b3c6e" stopOpacity="0.16" />
            <stop offset="1" stopColor="#0b3c6e" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick, i) => (
          <g key={tick}>
            <line
              x1={left}
              x2={right}
              y1={y(tick)}
              y2={y(tick)}
              stroke={i === 0 ? '#cbd5e1' : '#eef0f3'}
              strokeWidth={i === 0 ? 1.5 : 1}
            />
            <text x={left - 12} y={y(tick) + 5} textAnchor="end">
              {tick}
            </text>
          </g>
        ))}
        <path d={`${line} L${right} ${bottom} L${left} ${bottom} Z`} fill="url(#ad-trend-fill)" />
        <path
          d={line}
          fill="none"
          stroke="#0b3c6e"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={x(peakIndex)}
          cy={y(peak)}
          r="6"
          fill="#14a3a3"
          stroke="#fff"
          strokeWidth="2.5"
        />
        <text x={x(peakIndex)} y={y(peak) - 12} textAnchor="middle" fontWeight="700" fill="#0b3c6e">
          {peak}
        </text>
        <text x={left} y="226" textAnchor="start">
          {formatDayMonth(dateAt(0))}
        </text>
        <text x={x(middle)} y="226" textAnchor="middle">
          {formatDayMonth(dateAt(middle))}
        </text>
        <text x={right} y="226" textAnchor="end">
          {formatDayMonth(dateAt(values.length - 1))}
        </text>
      </svg>
      <figcaption>
        Total {values.length} hari: <strong>{fmt(total)} pesanan</strong>, tertinggi {peak} pesanan
        pada {formatDayMonth(dateAt(peakIndex))}.
      </figcaption>
    </figure>
  );
}

const RANGE_OPTIONS = [
  { value: '30', label: '30 Hari Terakhir' },
  { value: '14', label: '14 Hari Terakhir' },
  { value: '7', label: '7 Hari Terakhir' },
];

function activitySentence(entry) {
  const [before, after] = AUDIT_ACTIONS[entry.action].verb.split('{t}');
  return (
    <>
      <strong>{entry.actor.name}</strong> {before}
      <strong>{entry.target.label}</strong>
      {after}
    </>
  );
}

/** Dashboard Admin UPTD PPSGHD (desain Admin Dashboard). */
export default function AdminDashboardPage() {
  useDocumentTitle('Dashboard Admin');
  const { actor, verifications, reviews, categories, orders, audit } = useAdmin();
  const [range, setRange] = useState('30');

  const pending = verifications
    .filter((v) => v.status === 'menunggu')
    .sort((a, b) => new Date(a.registeredAt) - new Date(b.registeredAt));
  const reported = reviews.filter((r) => r.status === 'dilaporkan').length;
  const emptyCategories = categories.filter((c) => c.services === 0).length;
  const lateOrders = orders.filter(
    (o) => o.status === 'menunggu' && hoursSince(o.createdAt) > 20,
  ).length;
  const categoryOf = (id) => categories.find((c) => c.id === id);

  const actionItems = [
    {
      label: 'Penyedia menunggu verifikasi',
      count: pending.length,
      to: PATHS.adminVerification,
      icon: ShieldCheckIcon,
      tone: 'warning',
    },
    {
      label: 'Ulasan dilaporkan',
      count: reported,
      to: buildAdminPath(PATHS.adminReviews, { tab: 'dilaporkan' }),
      icon: FlagIcon,
      tone: 'danger',
    },
    {
      label: 'Kategori tanpa layanan',
      count: emptyCategories,
      to: PATHS.adminCategories,
      icon: ShapesIcon,
      tone: 'neutral',
    },
    {
      label: 'Pesanan Menunggu > 20 jam',
      count: lateOrders,
      to: buildAdminPath(PATHS.adminOrders, { status: 'menunggu' }),
      icon: ClockIcon,
      tone: 'warning',
    },
  ];

  return (
    <>
      <section className="ad-welcome" aria-labelledby="welcome-title">
        <div className="ad-welcome__text">
          <h1 id="welcome-title" className="ad-welcome__title">
            <span>Selamat Datang,</span> {actor.name}
          </h1>
          <p>
            Ada <strong>{pending.length} penyedia</strong> menunggu verifikasi dan{' '}
            <strong>{reported} ulasan</strong> dilaporkan.
          </p>
        </div>
        <div className="ad-welcome__side">
          <WelcomeArt />
          <figure className="ad-welcome__quote">
            <blockquote>“Setiap verifikasi membuka satu pintu kesempatan.”</blockquote>
          </figure>
        </div>
      </section>

      <section aria-label="Ringkasan platform" className="ad-stats">
        <StatCard
          label="Menunggu Verifikasi"
          icon={ShieldCheckIcon}
          tone="amber"
          value={fmt(pending.length)}
        >
          <Link to={PATHS.adminVerification} className="dash-panel__link ad-stat-link">
            Tinjau sekarang
            <ArrowRightIcon size={16} />
          </Link>
        </StatCard>
        <StatCard
          label="Penyedia Aktif"
          icon={BriefcaseIcon}
          tone="teal"
          value={fmt(PLATFORM_STATS.providers.value)}
        >
          <Trend value={PLATFORM_STATS.providers.trend} />
        </StatCard>
        <StatCard
          label="Pengguna Terdaftar"
          icon={UsersIcon}
          value={fmt(PLATFORM_STATS.users.value)}
        >
          <Trend value={PLATFORM_STATS.users.trend} />
        </StatCard>
        <StatCard
          label="Pesanan Bulan Ini"
          icon={ClipboardListIcon}
          tone="green"
          value={fmt(PLATFORM_STATS.ordersThisMonth.value)}
        >
          <Trend value={PLATFORM_STATS.ordersThisMonth.trend} />
        </StatCard>
      </section>

      <div className="ad-dash-grid">
        <section className="dash-card dash-panel" aria-labelledby="antrean-title">
          <div className="dash-panel__head">
            <h2 id="antrean-title" className="dash-panel__title">
              Antrean Verifikasi
              <Badge tone="warning">{pending.length} menunggu</Badge>
            </h2>
            <Link to={PATHS.adminVerification} className="dash-panel__link">
              Lihat Semua
              <ArrowRightIcon size={18} />
            </Link>
          </div>
          {pending.length ? (
            <div className="dash-table-wrap">
              <table className="dash-table ad-table">
                <caption className="visually-hidden">
                  Antrean verifikasi penyedia, terlama di atas
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Penyedia</th>
                    <th scope="col">Keahlian</th>
                    <th scope="col">Tanggal Daftar</th>
                    <th scope="col">Lama Menunggu</th>
                    <th scope="col">
                      <span className="visually-hidden">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pending.slice(0, 5).map((item) => {
                    const category = categoryOf(item.category);
                    const long = daysSince(item.registeredAt) >= 5;
                    return (
                      <tr key={item.id}>
                        <td>
                          <PersonCell person={item} secondary={item.city} />
                        </td>
                        <td>
                          <span className="ad-skill">
                            <CategoryIcon icon={category?.icon} size={18} />
                            {category?.name}
                          </span>
                        </td>
                        <td className="ad-nowrap">{formatDate(item.registeredAt)}</td>
                        <td>
                          {long ? (
                            <Badge tone="warning">{formatWaiting(item.registeredAt)}</Badge>
                          ) : (
                            <span className="ad-strong">{formatWaiting(item.registeredAt)}</span>
                          )}
                        </td>
                        <td>
                          <Link
                            to={buildAdminPath(PATHS.adminVerification, { tinjau: item.id })}
                            className="btn btn--primary ad-btn-sm"
                            aria-label={`Tinjau pendaftaran ${item.name}`}
                          >
                            Tinjau
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="ad-panel-empty">Tidak ada penyedia yang menunggu verifikasi.</p>
          )}
        </section>

        <section className="dash-card dash-panel" aria-labelledby="aktivitas-title">
          <div className="dash-panel__head">
            <h2 id="aktivitas-title" className="dash-panel__title">
              Aktivitas Terbaru
            </h2>
            <Link to={PATHS.adminAudit} className="dash-panel__link">
              Lihat Audit Log
              <ArrowRightIcon size={18} />
            </Link>
          </div>
          <ol className="ad-activity">
            {audit.slice(0, 4).map((entry) => (
              <li key={entry.id}>
                <span
                  className={`ad-activity__icon tone-${AUDIT_ACTIONS[entry.action].tone}`}
                  aria-hidden="true"
                >
                  <AuditActionIcon action={entry.action} size={20} strokeWidth={2.25} />
                </span>
                <div>
                  <p>{activitySentence(entry)}</p>
                  <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="ad-dash-grid ad-dash-grid--stretch">
        <section className="dash-card dash-panel" aria-labelledby="tren-title">
          <div className="dash-panel__head">
            <h2 id="tren-title" className="dash-panel__title">
              Tren Pesanan
            </h2>
            <FilterSelect
              label="Rentang waktu"
              hideLabel
              icon={CalendarIcon}
              value={range}
              onChange={setRange}
              options={RANGE_OPTIONS}
            />
          </div>
          <div className="ad-trend">
            <TrendChart values={ORDER_TREND.values.slice(-Number(range))} end={ORDER_TREND.end} />
            <div className="ad-trend__side">
              <div className="ad-mini-stat">
                <span>Pesanan Selesai</span>
                <strong>{fmt(ORDER_TREND.completed.value)}</strong>
                <Trend value={ORDER_TREND.completed.trend} note="30 hari terakhir" />
              </div>
              <div className="ad-mini-stat">
                <span>Pesanan Dibatalkan</span>
                <strong>{fmt(ORDER_TREND.cancelled)}</strong>
                <span className="ad-mini-stat__note">2% dari total, 30 hari terakhir</span>
              </div>
            </div>
          </div>
        </section>

        <section id="perlu-tindakan" className="dash-card dash-panel" aria-labelledby="perlu-title">
          <div className="dash-panel__head">
            <h2 id="perlu-title" className="dash-panel__title">
              Perlu Tindakan
            </h2>
          </div>
          <ul className="ad-todo">
            {actionItems.map(({ label, count, to, icon: Icon, tone }) => (
              <li key={label}>
                <span className={`ad-todo__icon tone-${tone}`} aria-hidden="true">
                  <Icon size={20} strokeWidth={2.25} />
                </span>
                <span className="ad-todo__label">{label}</span>
                <span className="ad-todo__count">{count}</span>
                <Link to={to} className="ad-todo__link" aria-label={`Buka: ${label}, ${count}`}>
                  Buka
                  <ArrowRightIcon size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
