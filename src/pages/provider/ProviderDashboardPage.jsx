import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
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
  StarOutlineIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { useAuth } from '@/context/useAuth';
import { remoteThreads, threadsForProvider, unreadCount } from '@/features/chat/chatStore';
import { isBackendId, useChatInbox } from '@/features/chat/chatSync';
import { useChatStore } from '@/features/chat/useChat';
import {
  acceptBooking,
  cancelProviderBooking,
  completeBooking,
  createOwnService,
  getOwnAvailability,
  getOwnProviderProfile,
  listActiveCategories,
  listOwnPortfolio,
  listOwnServices,
  listProviderBookings,
  rejectBooking,
  replaceOwnAvailability,
  startBooking,
  updateOwnProviderProfile,
  updateOwnService,
} from '@/features/dashboard/providerApi';
import {
  PROVIDER_ORDER_STATUS,
  computeProviderMetrics,
  fromApiProviderBooking,
  fromSampleProviderOrder,
  initialsOf,
} from '@/features/dashboard/providerDashboardAdapters';
import {
  LAST_7_DAYS,
  MONTH_STATS,
  PROFILE_CHECKLIST,
  PROVIDER_ID,
  TREND_TOTALS,
  profileCompleteness,
  sampleOrders,
} from '@/features/dashboard/providerDashboardData';
import { getProviderProfile } from '@/features/providers/providerProfiles';
import { CATEGORIES } from '@/features/search/catalog';
import { addDays, startOfDay, toISODate } from '@/features/booking/schedule';
import { apiErrorMessage } from '@/lib/api/client';
import { formatRating, formatRupiah } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { buildProviderPath } from '@/routes/paths';
import { ProviderCompleteModal, ProviderReasonModal } from './ProviderOrderModals';
import ProviderProfileSchedulePanel from './ProviderProfileSchedulePanel';
import ProviderServicesPanel from './ProviderServicesPanel';
import { providerNavItems } from './providerNav';
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
  if (order.status === 'completed' || now >= end) return { tone: 'neutral', label: 'Selesai' };
  if (order.status === 'in_progress' || now >= start) {
    return { tone: 'success', label: 'Berlangsung' };
  }
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
      <path d="M0 75 H196" stroke="#1a9a94" strokeWidth="3" />
      <path
        d="M96 18 L97.5 22.5 L102 24 L97.5 25.5 L96 30 L94.5 25.5 L90 24 L94.5 22.5 Z"
        fill="#1a9a94"
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
        stroke="#1a9a94"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M130 54 H140 V64"
        fill="none"
        stroke="#1a9a94"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="70" y="100" width="10" height="6" rx="2" fill="#d5dfea" />
      <rect x="86" y="96" width="10" height="10" rx="2" fill="#d5dfea" />
      <rect x="102" y="92" width="10" height="14" rx="2" fill="#d5dfea" />
      <g transform="translate(22 92) rotate(-35)">
        <rect x="0" y="-5" width="46" height="10" rx="5" fill="#0b3c6e" />
        <circle cx="48" cy="0" r="9" fill="none" stroke="#0b3c6e" strokeWidth="4" />
      </g>
      <path
        d="M178 22 L182 32 L192 34 L184 40 L186 50 L178 45 L170 50 L172 40 L164 34 L174 32 Z"
        fill="#1a9a94"
      />
      <path
        d="M30 20 L31.5 25 L36.5 26.5 L31.5 28 L30 33 L28.5 28 L23.5 26.5 L28.5 25 Z"
        fill="#0b3c6e"
      />
      <circle cx="190" cy="110" r="5" fill="#b4c5d8" />
    </svg>
  );
}

function buildDemoServices(profile) {
  return (profile.packages ?? []).map((pkg) => ({
    id: `demo-svc-${pkg.id}`,
    title: pkg.title,
    description: pkg.description ?? '',
    pricing_type: pkg.priceUnit === 'jam' ? 'hourly' : 'starting_from',
    price_amount: pkg.priceFrom,
    min_hours: pkg.priceUnit === 'jam' ? 1 : null,
    duration_estimate_min: null,
    service_mode: 'at_customer',
    is_active: true,
    category: { id: `cat-${profile.categorySlug}`, name: profile.category },
  }));
}

function buildDemoCategories() {
  return CATEGORIES.map((c) => ({ id: `cat-${c.slug}`, slug: c.slug, name: c.label }));
}

/**
 * Dashboard Penyedia Layanan (FR-PROV-*, FE-05b).
 * - Akun penyedia backend (id UUID) memuat & menyimpan data riil via `/provider/*` dan `/bookings/*`.
 * - Akun demo lokal tetap menampilkan data contoh agar mode offline/unit test berjalan mulus.
 */
export default function ProviderDashboardPage() {
  useDocumentTitle('Dashboard Penyedia');
  const location = useLocation();
  const [activeHash, setActiveHash] = useState(() => location.hash || '#ringkasan');
  const { user, signIn } = useAuth();
  const live = isBackendId(user?.id);
  const demoProfile = useMemo(() => getProviderProfile(PROVIDER_ID), []);

  useEffect(() => {
    setActiveHash(location.hash || '#ringkasan');
  }, [location.hash]);

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash || '#ringkasan');
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const now = new Date();
  const today = startOfDay(now);

  const [loadState, setLoadState] = useState(() => (live ? 'loading' : 'ready'));
  const [loadError, setLoadError] = useState('');
  const [reloadTick, setReloadTick] = useState(0);

  const [apiProfile, setApiProfile] = useState(null);
  const [orders, setOrders] = useState(() =>
    live ? [] : sampleOrders(today).map(fromSampleProviderOrder),
  );
  const [services, setServices] = useState(() => (live ? [] : buildDemoServices(demoProfile)));
  const [availability, setAvailability] = useState(() =>
    live
      ? []
      : (demoProfile.workDays ?? [1, 2, 3, 4, 5, 6]).map((day) => ({
          day_of_week: day,
          start_time: '08:00',
          end_time: '17:00',
        })),
  );
  const [portfolio, setPortfolio] = useState([]);
  const [categories, setCategories] = useState(() => (live ? [] : buildDemoCategories()));

  const [expanded, setExpanded] = useState('');
  const [busyOrderId, setBusyOrderId] = useState('');
  const [reasonModal, setReasonModal] = useState(null); // { order, mode: 'reject' | 'cancel' }
  const [completeModal, setCompleteModal] = useState(null); // order
  const [feedback, setFeedback] = useState(null); // { tone: 'success' | 'error', text }
  const [weekStart, setWeekStart] = useState(() => mondayOf(today));
  const [selectedDay, setSelectedDay] = useState(() => toISODate(today));

  useChatStore();
  useChatInbox('provider', live);

  useEffect(() => {
    if (!live) return undefined;
    const controller = new AbortController();
    let ignore = false;
    setLoadState('loading');
    setLoadError('');

    Promise.all([
      getOwnProviderProfile({ signal: controller.signal }),
      listProviderBookings({ signal: controller.signal }),
      listOwnServices({ signal: controller.signal }),
      getOwnAvailability({ signal: controller.signal }),
      listActiveCategories({ signal: controller.signal }),
      listOwnPortfolio({ signal: controller.signal }).catch(() => []),
    ])
      .then(([ownProfile, bookingRows, ownServices, ownSlots, activeCats, ownPortfolio]) => {
        if (ignore) return;
        setApiProfile(ownProfile);
        setOrders(bookingRows.map(fromApiProviderBooking));
        setServices(ownServices);
        setAvailability(ownSlots);
        setCategories(activeCats);
        setPortfolio(ownPortfolio);
        setLoadState('ready');
      })
      .catch((error) => {
        if (ignore || error?.name === 'AbortError') return;
        setLoadError(error?.message || 'Data dashboard penyedia belum bisa dimuat.');
        setLoadState('error');
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [live, user?.id, reloadTick]);

  const activeProfile = useMemo(() => {
    if (live && apiProfile) {
      return {
        id: apiProfile.id,
        name: apiProfile.display_name || user?.name || 'Penyedia Jasa',
        initials: initialsOf(apiProfile.display_name || user?.name),
        rating: apiProfile.rating_avg ?? 0,
        reviewCount: apiProfile.rating_count ?? 0,
        categoryIcon: demoProfile.categoryIcon,
        raw: apiProfile,
      };
    }
    return {
      id: PROVIDER_ID,
      name: demoProfile.name,
      initials: demoProfile.initials,
      rating: demoProfile.rating,
      reviewCount: demoProfile.reviewCount,
      categoryIcon: demoProfile.categoryIcon,
      raw: {
        display_name: demoProfile.name,
        phone: '+6281234567890',
        city: demoProfile.city,
        district: demoProfile.district ?? '',
        address_detail: demoProfile.address ?? '',
        service_radius_km: 10,
        disability_type: '',
        bio: demoProfile.description ?? '',
        communication_prefs: ['chat'],
      },
    };
  }, [live, apiProfile, user?.name, demoProfile]);

  const liveMetrics = useMemo(
    () =>
      computeProviderMetrics({
        orders,
        services,
        profile: apiProfile,
        portfolio,
        today,
      }),
    [orders, services, apiProfile, portfolio, today],
  );

  const newCount = orders.filter((o) => o.status === 'requested').length;
  const needsAction = orders.filter(
    (o) => o.status === 'requested' || o.status === 'accepted',
  ).length;
  const completeness = live ? liveMetrics.completeness : profileCompleteness();
  const checklistItems = live ? liveMetrics.checklist : PROFILE_CHECKLIST;

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const ordersOn = (iso) =>
    orders.filter(
      (o) =>
        toISODate(o.date) === iso &&
        o.status !== 'completed' &&
        o.status !== 'rejected' &&
        o.status !== 'cancelled',
    );
  const agenda = ordersOn(selectedDay);
  const selectedDate = days.find((d) => toISODate(d) === selectedDay) ?? new Date(selectedDay);

  const chartData = live ? liveMetrics.last7Days : LAST_7_DAYS;
  const trendLabels = chartData.map((_, i) => addDays(today, i - 6));
  const trendTotal = chartData.reduce((a, b) => a + b, 0);
  const trendMax = Math.max(...chartData, 0);
  const chartMax = Math.max(3, trendMax);
  const chartTicks = Array.from({ length: 4 }, (_, i) => Math.round((chartMax * i) / 3));
  const peakDay = trendLabels[chartData.lastIndexOf(trendMax)];

  const announce = (text, tone = 'success') => setFeedback({ tone, text });

  const applyOrderUpdate = (updated) => {
    setOrders((list) => list.map((o) => (o.id === updated.id ? updated : o)));
  };

  const handleAccept = async (order) => {
    setBusyOrderId(order.id);
    try {
      if (live) {
        const updated = await acceptBooking(order.id);
        applyOrderUpdate(fromApiProviderBooking(updated));
      } else {
        applyOrderUpdate({ ...order, status: 'accepted' });
      }
      announce(`Pesanan ${order.customer} kini berstatus diterima.`);
    } catch (err) {
      announce(apiErrorMessage(err, 'Gagal menerima pesanan.'), 'error');
    } finally {
      setBusyOrderId('');
    }
  };

  const handleStart = async (order) => {
    setBusyOrderId(order.id);
    try {
      if (live) {
        const updated = await startBooking(order.id);
        applyOrderUpdate(fromApiProviderBooking(updated));
      } else {
        applyOrderUpdate({ ...order, status: 'in_progress' });
      }
      announce(`Pesanan ${order.customer} kini berstatus diproses.`);
    } catch (err) {
      announce(apiErrorMessage(err, 'Gagal memulai pesanan.'), 'error');
    } finally {
      setBusyOrderId('');
    }
  };

  const handleReasonConfirm = async (reason) => {
    const { order, mode } = reasonModal;
    if (live) {
      const updated =
        mode === 'reject'
          ? await rejectBooking(order.id, reason)
          : await cancelProviderBooking(order.id, reason);
      applyOrderUpdate(fromApiProviderBooking(updated));
    } else {
      applyOrderUpdate({
        ...order,
        status: mode === 'reject' ? 'rejected' : 'cancelled',
        statusReason: reason,
      });
    }
    setReasonModal(null);
    announce(
      mode === 'reject'
        ? `Pesanan ${order.customer} telah ditolak.`
        : `Pesanan ${order.customer} telah dibatalkan.`,
    );
  };

  const handleCompleteConfirm = async (payload) => {
    const order = completeModal;
    if (live) {
      const updated = await completeBooking(order.id, payload);
      applyOrderUpdate(fromApiProviderBooking(updated));
    } else {
      const finalTotal =
        payload.final_total ??
        (payload.actual_quantity
          ? Math.round(order.unitPrice * payload.actual_quantity)
          : order.estimatedTotal);
      applyOrderUpdate({
        ...order,
        status: 'completed',
        actualQuantity: payload.actual_quantity ?? order.actualQuantity,
        finalTotal,
      });
    }
    setCompleteModal(null);
    announce(`Pesanan ${order.customer} kini berstatus selesai.`);
  };

  const handleSaveService = async (payload, serviceId) => {
    if (live) {
      const saved = serviceId
        ? await updateOwnService(serviceId, payload)
        : await createOwnService(payload);
      setServices((prev) =>
        serviceId ? prev.map((s) => (s.id === serviceId ? saved : s)) : [saved, ...prev],
      );
    } else {
      const cat = categories.find((c) => c.id === payload.category_id) ?? {
        id: payload.category_id,
        name: 'Layanan',
      };
      const localItem = {
        ...payload,
        id: serviceId ?? `demo-svc-${Date.now()}`,
        category: { id: cat.id, name: cat.name },
      };
      setServices((prev) =>
        serviceId ? prev.map((s) => (s.id === serviceId ? localItem : s)) : [localItem, ...prev],
      );
    }
    announce(
      serviceId
        ? `Layanan "${payload.title}" diperbarui.`
        : `Layanan "${payload.title}" ditambahkan.`,
    );
  };

  const handleToggleService = async (service) => {
    const nextActive = !service.is_active;
    if (live) {
      const updated = await updateOwnService(service.id, { is_active: nextActive });
      setServices((prev) => prev.map((s) => (s.id === service.id ? updated : s)));
    } else {
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, is_active: nextActive } : s)),
      );
    }
    announce(`Layanan "${service.title}" ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
  };

  const handleSaveProfile = async (payload) => {
    if (live) {
      const updated = await updateOwnProviderProfile(payload);
      setApiProfile(updated);
      if (user && updated?.display_name && updated.display_name !== user.name) {
        signIn({ ...user, name: updated.display_name });
      }
    } else {
      setApiProfile((prev) => ({ ...(prev ?? activeProfile.raw), ...payload }));
    }
    announce('Profil penyedia berhasil disimpan.');
  };

  const handleSaveAvailability = async (slots) => {
    if (live) {
      const saved = await replaceOwnAvailability(slots);
      setAvailability(saved);
    } else {
      setAvailability(slots);
    }
    announce('Jadwal operasional mingguan berhasil disimpan.');
  };

  const shiftWeek = (delta) => {
    const next = addDays(weekStart, delta * 7);
    setWeekStart(next);
    setSelectedDay(toISODate(next));
  };

  const threads = live ? remoteThreads() : threadsForProvider(PROVIDER_ID);
  const chatUnread = threads.reduce((sum, thread) => sum + unreadCount(thread, 'provider'), 0);
  const navItems = providerNavItems({
    page: 'dashboard',
    activeHash,
    newCount,
    chatUnread,
  });

  const statsMonthOrders = live ? liveMetrics.monthOrderCount : MONTH_STATS.orders.value;
  const statsActiveServices = live
    ? liveMetrics.activeServices
    : services.filter((s) => s.is_active).length;
  const statsTotalServices = live ? liveMetrics.totalServices : services.length;
  const statsMonthIncome = live ? liveMetrics.monthIncome : MONTH_STATS.income.value;
  const statsTotalOrders = live ? liveMetrics.totalOrderCount : TREND_TOTALS.orders.value;
  const statsTotalIncome = live ? liveMetrics.totalIncome : TREND_TOTALS.income.value;

  return (
    <DashboardShell
      subtitle="Talenta Difabel, Jabar Inklusif"
      navLabel="Menu penyedia"
      navItems={navItems}
      user={{
        name: activeProfile.name,
        initials: activeProfile.initials,
        role: 'Penyedia Layanan',
        color: '#0b3c6e',
      }}
      userMenuItems={[{ label: 'Lihat Profil Publik', to: buildProviderPath(activeProfile.id) }]}
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
            {activeProfile.name}
          </h1>
          <p>
            Terima kasih sudah melayani pelanggan dengan sepenuh hati.{' '}
            {needsAction > 0
              ? `Ada ${needsAction} pesanan yang menunggu tindak lanjut Anda.`
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

      {loadState === 'loading' && (
        <p className="provider-feedback" role="status">
          Memuat data dashboard penyedia dari server...
        </p>
      )}

      {live && apiProfile?.verification_status === 'pending' && (
        <div className="provider-feedback provider-feedback--warning" role="status">
          <span>
            Profil Anda sedang menunggu verifikasi admin UPTD PPSGHD. Lengkapi alamat, lokasi, dan
            layanan agar profil segera tampil di pencarian publik.
          </span>
        </div>
      )}

      {live && apiProfile?.verification_status === 'rejected' && (
        <div className="provider-feedback provider-feedback--error" role="alert">
          <span>
            Verifikasi profil penyedia Anda belum disetujui. Perbarui data profil Anda di bagian
            Pengaturan atau hubungi admin UPTD PPSGHD.
          </span>
        </div>
      )}

      {loadState === 'error' && (
        <div className="provider-feedback provider-feedback--error" role="alert">
          <span>{loadError}</span>
          <button
            type="button"
            className="dash-btn dash-btn--outline"
            onClick={() => setReloadTick((n) => n + 1)}
          >
            Muat Ulang
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`provider-feedback${feedback.tone === 'error' ? ' provider-feedback--error' : ''}`}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            className="dash-btn dash-btn--outline"
            onClick={() => setFeedback(null)}
          >
            Tutup
          </button>
        </div>
      )}

      <section aria-label="Ringkasan bulan ini">
        <div className="provider-stats">
          <StatCard label="Pesanan Bulan Ini" icon={BagIcon} value={statsMonthOrders}>
            {!live && <Trend value={MONTH_STATS.orders.trend} />}
            {live && <span className="dash-muted">Total tercatat: {statsTotalOrders} pesanan</span>}
          </StatCard>
          <StatCard
            label="Layanan Aktif"
            icon={BriefcaseIcon}
            tone="teal"
            value={
              <>
                {statsActiveServices}{' '}
                <span className="dash-stat__unit">dari {statsTotalServices} layanan</span>
              </>
            }
          >
            <a href="#layanan" className="dash-panel__link">
              Kelola layanan saya
              <ArrowRightIcon size={16} />
            </a>
          </StatCard>
          <StatCard
            label="Rating Rata-rata"
            icon={StarOutlineIcon}
            tone="amber"
            value={
              <span className="dash-stat__rating">
                {formatRating(activeProfile.rating)}
                <RatingStars value={activeProfile.rating} size={16} />
              </span>
            }
          >
            <span className="dash-muted">Dari {activeProfile.reviewCount} ulasan</span>
          </StatCard>
          <StatCard
            label="Pendapatan Bulan Ini"
            icon={WalletIcon}
            tone="green"
            value={<span className="dash-stat__money">{formatRupiah(statsMonthIncome)}</span>}
          >
            {!live && <Trend value={MONTH_STATS.income.trend} />}
            {live && <span className="dash-muted">Dari pesanan selesai bulan ini</span>}
          </StatCard>
        </div>
      </section>

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
          {orders.length ? (
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
                    const status = PROVIDER_ORDER_STATUS[order.status] ?? {
                      label: order.status,
                      tone: 'neutral',
                    };
                    const detailId = `pesanan-${order.id}`;
                    const open = expanded === order.id;
                    const busy = busyOrderId === order.id;
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
                              <img src={activeProfile.categoryIcon} alt="" width="18" height="18" />
                              <span>
                                <strong>{order.service}</strong>
                                <span className="dash-muted">
                                  {formatRupiah(order.finalTotal ?? order.estimatedTotal)}
                                </span>
                              </span>
                            </span>
                          </td>
                          <td>
                            <strong className="dash-block">{dateLabel(order.date, today)}</strong>
                            <span className="dash-muted">{order.startTime}</span>
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
                              {order.status === 'requested' && (
                                <>
                                  <button
                                    type="button"
                                    className="dash-btn dash-btn--primary"
                                    aria-label={`Terima pesanan ${order.customer}`}
                                    disabled={busy}
                                    onClick={() => handleAccept(order)}
                                  >
                                    Terima
                                  </button>
                                  <button
                                    type="button"
                                    className="dash-btn dash-btn--danger"
                                    aria-label={`Tolak pesanan ${order.customer}`}
                                    disabled={busy}
                                    onClick={() => setReasonModal({ order, mode: 'reject' })}
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}
                              {order.status === 'accepted' && (
                                <>
                                  <button
                                    type="button"
                                    className="dash-btn dash-btn--primary"
                                    aria-label={`Mulai pesanan ${order.customer}`}
                                    disabled={busy}
                                    onClick={() => handleStart(order)}
                                  >
                                    Mulai
                                  </button>
                                  <button
                                    type="button"
                                    className="dash-btn dash-btn--danger"
                                    aria-label={`Batalkan pesanan ${order.customer}`}
                                    disabled={busy}
                                    onClick={() => setReasonModal({ order, mode: 'cancel' })}
                                  >
                                    Batalkan
                                  </button>
                                </>
                              )}
                              {order.status === 'in_progress' && (
                                <button
                                  type="button"
                                  className="dash-btn dash-btn--primary"
                                  aria-label={`Selesai pesanan ${order.customer}`}
                                  disabled={busy}
                                  onClick={() => setCompleteModal(order)}
                                >
                                  Selesai
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        <tr id={detailId} className="orders-table__detail" hidden={!open}>
                          <td colSpan={5}>
                            <dl>
                              <div>
                                <dt>Jadwal & Kode</dt>
                                <dd>
                                  {order.code} · {WEEKDAY_LONG[order.date.getDay()]},{' '}
                                  {dateLabel(order.date, today)} · {order.startTime}
                                </dd>
                              </div>
                              <div>
                                <dt>Alamat & Kontak</dt>
                                <dd>
                                  {order.address}
                                  {order.customerPhone ? ` · ${order.customerPhone}` : ''}
                                </dd>
                              </div>
                              <div>
                                <dt>Catatan</dt>
                                <dd>
                                  {order.note || 'Tidak ada catatan.'}
                                  {order.statusReason ? ` (Alasan: ${order.statusReason})` : ''}
                                </dd>
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
          ) : (
            <p className="agenda__empty">Belum ada pesanan masuk saat ini.</p>
          )}
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
                      <img src={activeProfile.categoryIcon} alt="" width="20" height="20" />
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

      <ProviderServicesPanel
        services={services}
        categories={categories}
        onSave={handleSaveService}
        onToggleActive={handleToggleService}
      />

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
                data={chartData}
                min={0}
                max={chartMax}
                ticks={chartTicks}
                left={44}
                width={440}
                height={250}
                labels={trendLabels.map((d, i) =>
                  i === 0 || i === 6
                    ? `${d.getDate()} ${MONTH[d.getMonth()]}`
                    : String(d.getDate()),
                )}
                ariaLabel={`Pesanan harian ${trendLabels[0].getDate()} sampai ${trendLabels[6].getDate()} ${MONTH[trendLabels[6].getMonth()]}: ${chartData.join(', ')} pesanan`}
              />
              <figcaption>
                Total 7 hari terakhir: <strong>{trendTotal} pesanan</strong>, tertinggi {trendMax}{' '}
                pesanan pada {peakDay.getDate()} {MONTH[peakDay.getMonth()]}.
              </figcaption>
            </figure>
            <div className="trend__totals">
              <div>
                <span>Total Pesanan</span>
                <strong>{statsTotalOrders}</strong>
                {!live && <Trend value={TREND_TOTALS.orders.trend} note="" />}
              </div>
              <div>
                <span>Pendapatan Total</span>
                <strong className="trend__money">{formatRupiah(statsTotalIncome)}</strong>
                {!live && <Trend value={TREND_TOTALS.income.trend} note="" />}
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
            {checklistItems.map((item) => (
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
                  <a href="#profil" className="dash-soon">
                    Lengkapi
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section id="ulasan" className="dash-card dash-panel" aria-labelledby="ulasan-title">
        <PanelHead id="ulasan-title" title="Ulasan Pelanggan">
          <Link to={`${buildProviderPath(activeProfile.id)}#ulasan`} className="dash-panel__link">
            Lihat di profil publik
            <ArrowRightIcon size={16} />
          </Link>
        </PanelHead>
        <div className="provider-reviews-summary">
          <div className="provider-reviews-summary__score">
            <strong>{formatRating(activeProfile.rating)}</strong>
            <RatingStars value={activeProfile.rating} size={20} />
            <span className="dash-muted">
              Berdasarkan {activeProfile.reviewCount} ulasan pelanggan
            </span>
          </div>
          <p className="dash-panel__note">
            Pelanggan dapat memberikan ulasan setelah pesanan berstatus <strong>Selesai</strong>.
            Ulasan yang dipublikasikan akan otomatis memperbarui skor rating Anda.
          </p>
        </div>
      </section>

      <ProviderProfileSchedulePanel
        key={`${activeProfile.id}-${loadState}`}
        profile={activeProfile.raw}
        availability={availability}
        onSaveProfile={handleSaveProfile}
        onSaveAvailability={handleSaveAvailability}
      />

      <ProviderReasonModal
        key={reasonModal ? `${reasonModal.mode}-${reasonModal.order.id}` : 'reason-closed'}
        order={reasonModal?.order ?? null}
        mode={reasonModal?.mode ?? 'reject'}
        onClose={() => setReasonModal(null)}
        onConfirm={handleReasonConfirm}
      />

      <ProviderCompleteModal
        key={completeModal ? `complete-${completeModal.id}` : 'complete-closed'}
        order={completeModal}
        onClose={() => setCompleteModal(null)}
        onConfirm={handleCompleteConfirm}
      />
    </DashboardShell>
  );
}
