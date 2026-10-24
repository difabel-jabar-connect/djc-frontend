import { Fragment, useState } from 'react';
import { Link } from 'react-router';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { LineChart } from '@/components/dashboard/charts';
import { PanelHead, StatCard, StatusBadge, Trend } from '@/components/dashboard/DashboardWidgets';
import RatingStars from '@/components/ui/RatingStars';
import {
  ArrowRightIcon,
  BagIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DashboardIcon,
  InboxIcon,
  SettingsIcon,
  StarOutlineIcon,
  UserIcon,
  WalletIcon,
} from '@/components/ui/icons';
import {
  LAST_7_DAYS,
  MONTH_STATS,
  ORDER_STATUS,
  PROFILE_CHECKLIST,
  PROVIDER_ID,
  profileCompleteness,
  sampleOrders,
  TREND_TOTALS,
} from '@/features/dashboard/providerDashboardData';
import { getProviderProfile } from '@/features/providers/providerProfiles';
import { addDays, startOfDay, toISODate } from '@/features/booking/schedule';
import { formatRating, formatRupiah } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { buildProviderPath } from '@/routes/paths';
import './providerDashboard.css';

const WEEKDAY = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const WEEKDAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_LONG = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' });
const MONTH_NAME = new Intl.DateTimeFormat('id-ID', { month: 'long' });
const pad = (n) => String(n).padStart(2, '0');

/** Senin pada minggu yang memuat `date`. */
const mondayOf = (date) => addDays(date, -((date.getDay() + 6) % 7));

function weekLabel(monday) {
  const sunday = addDays(monday, 6);
  const endLabel = `${sunday.getDate()} ${MONTH_LONG.format(sunday)}`;
  return monday.getMonth() === sunday.getMonth()
    ? `${monday.getDate()} – ${endLabel}`
    : `${monday.getDate()} ${MONTH_NAME.format(monday)} – ${endLabel}`;
}

const dateLabel = (date, today) =>
  toISODate(date) === toISODate(today)
    ? 'Hari ini'
    : `${date.getDate()} ${MONTH[date.getMonth()]} ${date.getFullYear()}`;

/** Status agenda berdasar waktu sekarang. */
function agendaState(order, now) {
  const start = new Date(order.date);
  start.setHours(order.start);
  const end = new Date(start);
  end.setHours(order.start + order.hours);
  if (now >= end) return { tone: 'neutral', label: 'Selesai' };
  if (now >= start) return { tone: 'success', label: 'Berlangsung' };
  return { tone: 'info', label: 'Akan Datang' };
}

function SidebarArt() {
  return (
    <svg width="196" height="76" viewBox="0 0 196 76" aria-hidden="true" focusable="false">
      <circle cx="150" cy="22" r="12" fill="#fff" />
      <g
        fill="none"
        stroke="#0b3c6e"
        strokeWidth="2.25"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        <path d="M2 76 V54 H18 V40 H30 V54 H40 V76" />
        <path d="M44 76 V46 L58 36 L72 46 V76" />
        <path d="M54 76 V62 H62 V76" />
        <path d="M78 76 V40 H86 V30 C86 22 106 22 106 30 V40 H114 V76" />
        <path d="M90 50 H102 M90 60 H102" />
        <path d="M120 76 V50 L136 42 L152 50 V76" />
        <path d="M158 76 V58 H170 V48 H184 V76" />
      </g>
      <path d="M0 75 H196" stroke="#14a3a3" strokeWidth="3" />
      <path
        d="M96 18 L97.5 22.5 L102 24 L97.5 25.5 L96 30 L94.5 25.5 L90 24 L94.5 22.5 Z"
        fill="#14a3a3"
      />
    </svg>
  );
}

function BannerArt() {
  return (
    <svg
      className="welcome__art"
      width="210"
      height="140"
      viewBox="0 0 210 140"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="110" cy="70" r="62" fill="#fff" opacity="0.7" />
      <rect
        x="56"
        y="34"
        width="108"
        height="78"
        rx="12"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3"
      />
      <path
        d="M70 96 L92 76 L108 86 L140 54"
        fill="none"
        stroke="#14a3a3"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M130 54 H140 V64"
        fill="none"
        stroke="#14a3a3"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="70" y="100" width="10" height="6" rx="2" fill="#c9e3f2" />
      <rect x="86" y="96" width="10" height="10" rx="2" fill="#c9e3f2" />
      <rect x="102" y="92" width="10" height="14" rx="2" fill="#c9e3f2" />
      <g transform="translate(22 92) rotate(-35)">
        <rect x="0" y="-5" width="46" height="10" rx="5" fill="#0b3c6e" />
        <circle cx="48" cy="0" r="9" fill="none" stroke="#0b3c6e" strokeWidth="4" />
      </g>
      <path
        d="M178 22 L182 32 L192 34 L184 40 L186 50 L178 45 L170 50 L172 40 L164 34 L174 32 Z"
        fill="#14a3a3"
      />
      <path
        d="M30 20 L31.5 25 L36.5 26.5 L31.5 28 L30 33 L28.5 28 L23.5 26.5 L28.5 25 Z"
        fill="#0b3c6e"
      />
      <circle cx="190" cy="110" r="5" fill="#b6d4e8" />
    </svg>
  );
}

/** Dashboard Penyedia Layanan (FR-PROV-*). Data contoh; aksi pesanan belum tersambung API. */
export default function ProviderDashboardPage() {
  useDocumentTitle('Dashboard Penyedia');
  const profile = getProviderProfile(PROVIDER_ID);
  const now = new Date();
  const today = startOfDay(now);
  const [orders, setOrders] = useState(() => sampleOrders(today));
  const [expanded, setExpanded] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [weekStart, setWeekStart] = useState(() => mondayOf(today));
  const [selectedDay, setSelectedDay] = useState(() => toISODate(today));

  const newCount = orders.filter((o) => o.status === 'baru').length;
  const needsAction = orders.filter((o) => o.status === 'baru' || o.status === 'menunggu').length;
  const completeness = profileCompleteness();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const ordersOn = (iso) =>
    orders.filter((o) => toISODate(o.date) === iso && o.status !== 'selesai');
  const agenda = ordersOn(selectedDay);
  const selectedDate = days.find((d) => toISODate(d) === selectedDay) ?? new Date(selectedDay);
  const trendLabels = LAST_7_DAYS.map((_, i) => addDays(today, i - 6));
  const trendTotal = LAST_7_DAYS.reduce((a, b) => a + b, 0);
  const trendMax = Math.max(...LAST_7_DAYS);
  const peakDay = trendLabels[LAST_7_DAYS.lastIndexOf(trendMax)];

  const advance = (order) => {
    const status = ORDER_STATUS[order.status];
    // TODO(API): kirim perubahan status pesanan ke backend.
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: status.next } : o)));
    setAnnouncement(
      `Pesanan ${order.customer} kini berstatus ${ORDER_STATUS[status.next].label.toLowerCase()}.`,
    );
  };

  const shiftWeek = (delta) => {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
    setSelectedDay(toISODate(next));
  };

  const navItems = [
    { label: 'Dashboard', icon: DashboardIcon, href: '#ringkasan', current: true },
    { label: 'Profil Saya', icon: UserIcon, to: buildProviderPath(PROVIDER_ID) },
    { label: 'Layanan Saya', icon: BriefcaseIcon },
    {
      label: 'Pesanan Masuk',
      icon: InboxIcon,
      href: '#pesanan',
      badge: newCount,
      badgeLabel: 'baru',
    },
    { label: 'Jadwal', icon: CalendarIcon, href: '#jadwal' },
    { label: 'Ulasan', icon: StarOutlineIcon, to: `${buildProviderPath(PROVIDER_ID)}#ulasan` },
    { label: 'Pengaturan', icon: SettingsIcon },
  ];

  return (
    <DashboardShell
      subtitle="Talenta Difabel, Jabar Inklusif"
      navLabel="Menu penyedia"
      navItems={navItems}
      user={{
        name: profile.name,
        initials: profile.initials,
        role: 'Penyedia Layanan',
        color: '#0b3c6e',
      }}
      userMenuItems={[{ label: 'Lihat Profil Publik', to: buildProviderPath(PROVIDER_ID) }]}
      notifications={{ count: needsAction, href: '#pesanan' }}
      sidebarNote={{
        text: 'Bersama Mewujudkan Jawa Barat yang Lebih Inklusif',
        art: <SidebarArt />,
      }}
    >
      <section id="ringkasan" className="welcome" aria-labelledby="welcome-title">
        <div className="welcome__text">
          <h1 id="welcome-title">
            <span>Selamat Datang,</span>
            {profile.name}
          </h1>
          <p>
            Terima kasih sudah melayani pelanggan dengan sepenuh hati.{' '}
            {needsAction > 0
              ? `Ada ${needsAction} pesanan yang menunggu konfirmasi Anda.`
              : 'Semua pesanan sudah Anda tanggapi.'}
          </p>
        </div>
        <div className="welcome__aside">
          <BannerArt />
          <figure className="welcome__quote">
            <blockquote>“Karya terbaik lahir dari ketekunan, bukan dari kesempurnaan.”</blockquote>
          </figure>
        </div>
      </section>

      <section aria-label="Ringkasan bulan ini">
        <div className="provider-stats">
          <StatCard label="Pesanan Bulan Ini" icon={BagIcon} value={MONTH_STATS.orders.value}>
            <Trend value={MONTH_STATS.orders.trend} />
          </StatCard>
          <StatCard
            label="Layanan Aktif"
            icon={BriefcaseIcon}
            tone="teal"
            value={
              <>
                {MONTH_STATS.services.active}{' '}
                <span className="dash-stat__unit">dari {MONTH_STATS.services.total} layanan</span>
              </>
            }
          >
            <Link to={buildProviderPath(PROVIDER_ID)} className="dash-panel__link">
              Lihat layanan di profil
              <ArrowRightIcon size={16} />
            </Link>
          </StatCard>
          <StatCard
            label="Rating Rata-rata"
            icon={StarOutlineIcon}
            tone="amber"
            value={
              <span className="dash-stat__rating">
                {formatRating(profile.rating)}
                <RatingStars value={profile.rating} size={16} />
              </span>
            }
          >
            <span className="dash-muted">Dari {profile.reviewCount} ulasan</span>
          </StatCard>
          <StatCard
            label="Pendapatan Bulan Ini"
            icon={WalletIcon}
            tone="green"
            value={
              <span className="dash-stat__money">{formatRupiah(MONTH_STATS.income.value)}</span>
            }
          >
            <Trend value={MONTH_STATS.income.trend} />
          </StatCard>
        </div>
      </section>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <div className="provider-grid">
        <section
          id="pesanan"
          className="dash-card dash-panel dash-panel--table"
          aria-labelledby="pesanan-title"
        >
          <PanelHead
            id="pesanan-title"
            title={
              <>Pesanan Masuk {newCount > 0 && <span className="dash-new">{newCount} baru</span>}</>
            }
          />
          <div className="dash-table-wrap">
            <table className="dash-table orders-table">
              <thead>
                <tr>
                  <th scope="col">Pelanggan</th>
                  <th scope="col">Layanan</th>
                  <th scope="col">Tanggal</th>
                  <th scope="col">Status</th>
                  <th scope="col">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const status = ORDER_STATUS[order.status];
                  const detailId = `pesanan-${order.id}`;
                  const open = expanded === order.id;
                  return (
                    <Fragment key={order.id}>
                      <tr>
                        <td>
                          <span className="dash-person">
                            <span
                              className="dash-avatar dash-avatar--md"
                              style={{ backgroundColor: order.color }}
                              aria-hidden="true"
                            >
                              {order.initials}
                            </span>
                            <span>
                              <strong>{order.customer}</strong>
                              <span className="dash-muted">{order.city}</span>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="dash-person">
                            <img src={profile.categoryIcon} alt="" width="18" height="18" />
                            {order.service}
                          </span>
                        </td>
                        <td>
                          <strong className="dash-block">{dateLabel(order.date, today)}</strong>
                          <span className="dash-muted">{pad(order.start)}.00</span>
                        </td>
                        <td>
                          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                        </td>
                        <td>
                          <div className="orders-table__actions">
                            <button
                              type="button"
                              className="dash-btn dash-btn--outline"
                              aria-expanded={open}
                              aria-controls={detailId}
                              aria-label={`Lihat pesanan ${order.customer}`}
                              onClick={() => setExpanded(open ? '' : order.id)}
                            >
                              Lihat
                            </button>
                            {status.action && (
                              <button
                                type="button"
                                className="dash-btn dash-btn--primary"
                                aria-label={`${status.action} pesanan ${order.customer}`}
                                onClick={() => advance(order)}
                              >
                                {status.action}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      <tr id={detailId} className="orders-table__detail" hidden={!open}>
                        <td colSpan={5}>
                          <dl>
                            <div>
                              <dt>Jadwal</dt>
                              <dd>
                                {WEEKDAY_LONG[order.date.getDay()]}, {dateLabel(order.date, today)}{' '}
                                · {pad(order.start)}.00–{pad(order.start + order.hours)}.00
                              </dd>
                            </div>
                            <div>
                              <dt>Alamat</dt>
                              <dd>{order.address}</dd>
                            </div>
                            <div>
                              <dt>Catatan</dt>
                              <dd>{order.note || 'Tidak ada catatan.'}</dd>
                            </div>
                          </dl>
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section id="jadwal" className="dash-card dash-panel" aria-labelledby="jadwal-title">
          <PanelHead id="jadwal-title" title="Jadwal Minggu Ini" />
          <div className="week-nav">
            <button
              type="button"
              className="calendar__nav"
              aria-label="Minggu sebelumnya"
              onClick={() => shiftWeek(-1)}
            >
              <ChevronLeftIcon strokeWidth={2.25} />
            </button>
            <p aria-live="polite">{weekLabel(weekStart)}</p>
            <button
              type="button"
              className="calendar__nav"
              aria-label="Minggu berikutnya"
              onClick={() => shiftWeek(1)}
            >
              <ChevronRightIcon strokeWidth={2.25} />
            </button>
          </div>
          <div role="group" aria-label="Hari dalam minggu ini" className="week-strip">
            {days.map((day) => {
              const iso = toISODate(day);
              const busy = ordersOn(iso).length > 0;
              const isToday = iso === toISODate(today);
              const notes = [isToday && 'hari ini', busy && 'ada jadwal']
                .filter(Boolean)
                .join(', ');
              return (
                <button
                  key={iso}
                  type="button"
                  className={`week-strip__day${isToday ? ' week-strip__day--today' : ''}`}
                  aria-pressed={selectedDay === iso}
                  aria-current={isToday ? 'date' : undefined}
                  aria-label={`${WEEKDAY_LONG[day.getDay()]} ${day.getDate()} ${MONTH[day.getMonth()]}${notes ? `, ${notes}` : ''}`}
                  onClick={() => setSelectedDay(iso)}
                >
                  <span className="week-strip__name">{WEEKDAY[day.getDay()]}</span>
                  <span className="week-strip__date">{day.getDate()}</span>
                  <span
                    className={`week-strip__dot${busy ? ' week-strip__dot--on' : ''}`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
          <p className="week-legend">
            <span className="week-strip__dot week-strip__dot--on" aria-hidden="true" />
            Titik = ada jadwal
          </p>
          <h3 className="agenda__title">
            Agenda {WEEKDAY_LONG[selectedDate.getDay()]}, {selectedDate.getDate()}{' '}
            {MONTH[selectedDate.getMonth()]}
          </h3>
          {agenda.length ? (
            <ul className="agenda">
              {agenda.map((order) => {
                const state = agendaState(order, now);
                return (
                  <li key={order.id} className={`agenda__item agenda__item--${state.tone}`}>
                    <span className="icon-tile icon-tile--soft-teal" aria-hidden="true">
                      <img src={profile.categoryIcon} alt="" width="20" height="20" />
                    </span>
                    <span className="agenda__text">
                      <span className="agenda__time">
                        {pad(order.start)}.00 – {pad(order.start + order.hours)}.00
                      </span>
                      <strong>{order.service}</strong>
                      <span className="dash-muted">{order.customer}</span>
                    </span>
                    <StatusBadge tone={state.tone}>{state.label}</StatusBadge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="agenda__empty">Tidak ada jadwal pada hari ini.</p>
          )}
        </section>
      </div>

      <div className="provider-grid provider-grid--stretch">
        <section className="dash-card dash-panel" aria-labelledby="tren-title">
          <PanelHead id="tren-title" title="Tren Pesanan">
            <span className="dash-chip">
              <CalendarIcon size={18} />7 Hari Terakhir
            </span>
          </PanelHead>
          <div className="trend">
            <figure className="dash-chart trend__chart">
              <LineChart
                data={LAST_7_DAYS}
                min={0}
                max={3}
                ticks={[0, 1, 2, 3]}
                left={44}
                width={440}
                height={250}
                labels={trendLabels.map((d, i) =>
                  i === 0 || i === 6
                    ? `${d.getDate()} ${MONTH[d.getMonth()]}`
                    : String(d.getDate()),
                )}
                ariaLabel={`Pesanan harian ${trendLabels[0].getDate()} sampai ${trendLabels[6].getDate()} ${MONTH[trendLabels[6].getMonth()]}: ${LAST_7_DAYS.join(', ')} pesanan`}
              />
              <figcaption>
                Total 7 hari terakhir: <strong>{trendTotal} pesanan</strong>, tertinggi {trendMax}{' '}
                pesanan pada {peakDay.getDate()} {MONTH[peakDay.getMonth()]}.
              </figcaption>
            </figure>
            <div className="trend__totals">
              <div>
                <span>Total Pesanan</span>
                <strong>{TREND_TOTALS.orders.value}</strong>
                <Trend value={TREND_TOTALS.orders.trend} note="" />
              </div>
              <div>
                <span>Pendapatan Total</span>
                <strong className="trend__money">{formatRupiah(TREND_TOTALS.income.value)}</strong>
                <Trend value={TREND_TOTALS.income.trend} note="" />
              </div>
            </div>
          </div>
        </section>

        <section className="dash-card dash-panel profile-progress" aria-labelledby="profil-title">
          <PanelHead id="profil-title" title="Lengkapi Profil Anda" />
          <div className="profile-progress__bar">
            <div className="profile-progress__meta">
              <span>Kelengkapan profil</span>
              <strong>{completeness}%</strong>
            </div>
            <div
              role="progressbar"
              aria-valuenow={completeness}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Kelengkapan profil"
              className="progress"
            >
              <span style={{ width: `${completeness}%` }} />
            </div>
          </div>
          <p className="dash-panel__note">
            Profil lengkap membuat pelanggan lebih percaya dan peluang dipesan lebih besar.
          </p>
          <ul className="checklist">
            {PROFILE_CHECKLIST.map((item) => (
              <li key={item.label}>
                {item.done ? (
                  <CheckBadgeIcon className="checklist__done" />
                ) : (
                  <span className="checklist__todo" aria-hidden="true" />
                )}
                <span className="checklist__label">
                  {item.label}
                  {!item.done && <span className="dash-muted"> (belum)</span>}
                </span>
                {item.done ? (
                  <span className="checklist__status">Lengkap</span>
                ) : (
                  <span className="dash-soon">Segera</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DashboardShell>
  );
}
