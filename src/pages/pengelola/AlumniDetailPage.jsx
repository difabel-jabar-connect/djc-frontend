import { useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { LineChart } from '@/components/dashboard/charts';
import {
  AlertCircleIcon,
  AlertIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  ExternalLinkIcon,
  GraduationIcon,
  MapPinIcon,
  MinusIcon,
  MoreVerticalIcon,
  PencilIcon,
  StarFilledIcon,
  StarOutlineIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDate, formatDateTime } from '@/features/admin/adminFormat';
import { BOOKING_STATUS } from '@/features/booking/customerBookings';
import { PROFILE_FIELDS, SERVICE_STATUS, profileScore } from '@/features/pengelola/pengelolaData';
import { formatScore } from '@/features/pengelola/pengelolaFormat';
import { usePengelolaActions } from '@/features/pengelola/usePengelolaActions';
import { getSampleProvider } from '@/features/providers/sampleProviders';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatRupiah } from '@/lib/format';
import { PATHS, buildAdminPath, buildProviderPath } from '@/routes/paths';
import ActionMenu from '../admin/ActionMenu';
import { Avatar, Badge, EmptyState } from '../admin/AdminParts';
import { AlumniStatusBadge, CategoryLabel, ProfileProgress } from './PengelolaParts';
import RevisionDialog from './RevisionDialog';

const DAYS = [
  [1, 'Sen', 'Senin'],
  [2, 'Sel', 'Selasa'],
  [3, 'Rab', 'Rabu'],
  [4, 'Kam', 'Kamis'],
  [5, 'Jum', 'Jumat'],
  [6, 'Sab', 'Sabtu'],
  [0, 'Min', 'Minggu'],
];
const MONTH_LABELS = ['Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt'];
const HISTORY = {
  terverifikasi: { label: 'Terverifikasi', tone: 'success', icon: CheckIcon },
  diperbarui: { label: 'Data diperbarui', tone: 'info', icon: PencilIcon },
  perbaikan: { label: 'Perlu Perbaikan Data', tone: 'orange', icon: AlertIcon },
  menunggu: { label: 'Menunggu Verifikasi', tone: 'warning', icon: ClockIcon },
};

function Card({ id, title, description, action, children }) {
  return (
    <section className="dash-card pg-card" aria-labelledby={id}>
      <div className="pg-card__head">
        <div>
          <h2 id={id} className="pg-card__title">
            {title}
          </h2>
          {description && <p className="pg-card__desc">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stars({ value }) {
  return (
    <span role="img" aria-label={`Rating ${value} dari 5`} className="pg-stars">
      {[1, 2, 3, 4, 5].map((n) =>
        n <= value ? (
          <StarFilledIcon key={n} size={16} aria-hidden="true" />
        ) : (
          <StarOutlineIcon key={n} size={16} aria-hidden="true" className="pg-stars__off" />
        ),
      )}
    </span>
  );
}

function LocationMap({ name, city }) {
  return (
    <svg
      className="pg-location-map"
      viewBox="0 0 480 200"
      role="img"
      aria-label={`Peta lokasi ${name} di ${city}, radius layanan 10 kilometer`}
    >
      <rect width="480" height="200" fill="#f1f4f7" />
      <path
        d="M0 144 C90 120 160 180 250 156 S420 120 480 140"
        fill="none"
        stroke="#c9dceb"
        strokeWidth="16"
      />
      <rect x="300" y="18" width="120" height="70" rx="10" fill="#e3efe3" />
      <rect x="40" y="26" width="90" height="56" rx="10" fill="#e3efe3" />
      <g fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round">
        <path d="M0 90 H480" />
        <path d="M180 0 C190 80 170 140 200 200" />
        <path d="M330 0 L360 200" />
        <path d="M60 200 L120 0" />
      </g>
      <circle
        cx="240"
        cy="96"
        r="70"
        fill="#14a3a3"
        fillOpacity="0.1"
        stroke="#0c7272"
        strokeWidth="2"
        strokeDasharray="7 6"
      />
      <g transform="translate(240 104)">
        <path
          d="M0 0 C-3 -9 -16 -18 -16 -32 A16 16 0 1 1 16 -32 C16 -18 3 -9 0 0 Z"
          fill="#14a3a3"
          stroke="#fff"
          strokeWidth="3"
        />
        <circle cx="0" cy="-32" r="6" fill="#fff" />
      </g>
      <text x="470" y="192" textAnchor="end" fontSize="11" fill="#4b5563">
        © OpenStreetMap contributors
      </text>
    </svg>
  );
}

/** Detail Alumni (desain Pengelola · Detail Alumni). */
export default function AlumniDetailPage() {
  const { id } = useParams();
  const { alumni, services, run, notify } = useAdmin();
  const { requestAlumniRevision } = usePengelolaActions();
  const uid = useId();
  const navigate = useNavigate();
  const [revising, setRevising] = useState(false);
  const item = alumni.find((a) => a.id === id);
  useDocumentTitle(item ? `Detail Alumni · ${item.name}` : 'Alumni tidak ditemukan');

  if (!item)
    return (
      <EmptyState
        icon={GraduationIcon}
        title="Alumni tidak ditemukan"
        action={
          <Link to={PATHS.pengelolaAlumni} className="btn btn--primary">
            <ArrowLeftIcon size={18} />
            Kembali ke Data Alumni
          </Link>
        }
      >
        Data mungkin sudah dihapus atau tautannya salah.
      </EmptyState>
    );

  const own = services.filter((s) => s.provider === item.id);
  const activeCount = own.filter((s) => s.status === 'aktif').length;
  const total = Object.values(item.orderStats).reduce((sum, n) => sum + n, 0);
  const chartMax = Math.max(8, Math.ceil(Math.max(...item.monthly) / 8) * 8);
  const checklist = [...PROFILE_FIELDS].sort(
    (a, b) => Number(!item.missing.includes(a.key)) - Number(!item.missing.includes(b.key)),
  );
  const history = [
    ...(item.revisionRequest
      ? [
          {
            status: 'perbaikan',
            at: item.revisionRequest.at,
            by: item.revisionRequest.by,
            reason: `${item.revisionRequest.sections.join(', ')}: ${item.revisionRequest.note}`,
          },
        ]
      : []),
    ...item.history,
  ];
  const publicProfile = getSampleProvider(item.id);

  const confirmRevision = async (sections, note) => {
    await run(() => requestAlumniRevision(item.id, sections, note));
    setRevising(false);
    notify(`Permintaan perbaikan data dikirim ke ${item.name}. Tercatat di Audit Log.`);
  };

  return (
    <>
      <div className="pg-crumbs">
        <nav aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to={PATHS.pengelolaAlumni}>Data Alumni</Link>
              <ChevronRightIcon size={16} aria-hidden="true" />
            </li>
            <li aria-current="page">{item.name}</li>
          </ol>
        </nav>
        <Link to={PATHS.pengelolaAlumni} className="pg-back">
          <ArrowLeftIcon size={18} strokeWidth={2.25} />
          Kembali
        </Link>
      </div>

      <section className="dash-card pg-hero" aria-labelledby={`${uid}-name`}>
        <Avatar person={item} size={88} />
        <div className="pg-hero__text">
          <div className="pg-hero__title">
            <h1 id={`${uid}-name`} tabIndex={-1}>
              {item.name}
            </h1>
            <AlumniStatusBadge status={item.status} />
            <Badge tone="teal" icon={GraduationIcon}>
              Alumni PPSGHD
            </Badge>
          </div>
          <ul className="pg-hero__meta">
            <li>
              <CategoryLabel id={item.category} />
            </li>
            <li>
              <MapPinIcon size={18} />
              {item.city}
            </li>
            <li>
              <StarOutlineIcon size={18} />
              {item.rating == null
                ? 'Belum ada ulasan'
                : `${formatScore(item.rating)} · ${item.reviewCount} ulasan`}
            </li>
            <li>
              <CalendarIcon size={18} />
              Bergabung {formatDate(item.joinedAt)}
            </li>
          </ul>
        </div>
        <div className="pg-hero__actions">
          {publicProfile && (
            <Link
              to={buildProviderPath(item.id)}
              target="_blank"
              rel="noreferrer"
              className="btn btn--outline btn--md"
              aria-label={`Lihat profil publik ${item.name}, membuka tab baru`}
            >
              <ExternalLinkIcon size={18} strokeWidth={2.25} />
              Lihat Profil Publik
            </Link>
          )}
          <ActionMenu
            label={`Aksi lain untuk ${item.name}`}
            menuLabel={`Aksi untuk ${item.name}`}
            buttonClassName="pg-icon-btn"
            buttonContent={<MoreVerticalIcon size={22} strokeWidth={2.5} />}
            items={[
              {
                label: 'Minta Perbaikan Data',
                description: 'Kirim catatan bagian yang perlu dilengkapi.',
                icon: AlertIcon,
                onSelect: () => setRevising(true),
              },
              {
                label: 'Lihat Riwayat di Audit Log',
                icon: ClockIcon,
                onSelect: () => navigate(buildAdminPath(PATHS.adminAudit, { cari: item.name })),
              },
            ]}
          />
        </div>
      </section>

      <div className="pg-detail-grid">
        <div className="pg-detail-col">
          <Card
            id={`${uid}-kel`}
            title="Kelengkapan Data Penyedia"
            description={`Data minimum sesuai PRD · ${profileScore(item)} dari ${PROFILE_FIELDS.length} lengkap.`}
          >
            <ProfileProgress alumni={item} />
            <ul className="pg-checklist">
              {checklist.map(({ key, label }) => {
                const missing = item.missing.includes(key);
                return (
                  <li key={key} className={missing ? 'is-missing' : 'is-ok'}>
                    {missing ? (
                      <AlertCircleIcon size={22} strokeWidth={2.25} />
                    ) : (
                      <CheckCircleIcon size={22} strokeWidth={2.25} />
                    )}
                    <span>{label}</span>
                    <strong>{missing ? 'Belum ada' : 'Lengkap'}</strong>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card
            id={`${uid}-lay`}
            title="Layanan"
            description={`${own.length} layanan · ${activeCount} aktif.`}
            action={
              <Link
                to={buildAdminPath(PATHS.pengelolaServices, { cari: item.name })}
                className="pg-card__link"
              >
                Lihat di Data Layanan →
              </Link>
            }
          >
            {own.length ? (
              <div className="dash-table-wrap">
                <table className="dash-table ad-table pg-compact-table">
                  <caption className="visually-hidden">Layanan {item.name}</caption>
                  <thead>
                    <tr>
                      <th scope="col">Nama Layanan</th>
                      <th scope="col">Kategori</th>
                      <th scope="col">Harga</th>
                      <th scope="col">Status</th>
                      <th scope="col">Pesanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {own.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <strong>{s.name}</strong>
                        </td>
                        <td>
                          <CategoryLabel id={s.category} />
                        </td>
                        <td className="ad-nowrap">
                          <strong className="pg-price">{formatRupiah(s.price)}</strong>
                          <span className="ad-muted-cell">/{s.unit}</span>
                        </td>
                        <td>
                          <Badge tone={SERVICE_STATUS[s.status].tone}>
                            {SERVICE_STATUS[s.status].label}
                          </Badge>
                        </td>
                        <td>
                          <strong>{s.orders}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="ad-muted-text">Belum ada layanan.</p>
            )}
          </Card>

          <Card
            id={`${uid}-stat`}
            title="Statistik Pesanan"
            description={`Total ${total} pesanan sejak bergabung.`}
          >
            <ul className="pg-status-grid" aria-label="Pesanan per status">
              {Object.entries(BOOKING_STATUS).map(([key, meta]) => (
                <li key={key}>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <strong>{item.orderStats[key]}</strong>
                </li>
              ))}
            </ul>
            <figure className="pg-figure">
              <LineChart
                data={item.monthly}
                min={0}
                max={chartMax}
                ticks={[0, chartMax / 2, chartMax]}
                labels={MONTH_LABELS}
                width={600}
                height={190}
                ariaLabel={`Pesanan ${item.name} per bulan, Mei sampai Oktober 2026: ${item.monthly.join(', ')}`}
              />
              <figcaption>
                6 bulan terakhir: dari {item.monthly[0]} (Mei) menjadi{' '}
                {item.monthly[item.monthly.length - 1]} pesanan (Okt).
              </figcaption>
            </figure>
          </Card>

          <Card
            id={`${uid}-ul`}
            title="Ulasan Terbaru"
            description={
              item.rating == null
                ? 'Belum ada ulasan.'
                : `Rata-rata ${formatScore(item.rating)} dari ${item.reviewCount} ulasan.`
            }
            action={
              <Link
                to={buildAdminPath(PATHS.adminReviews, { cari: item.name })}
                className="pg-card__link"
              >
                Lihat di Moderasi Ulasan →
              </Link>
            }
          >
            {item.reviews.length ? (
              <ul className="pg-reviews">
                {item.reviews.map((review) => (
                  <li key={review.code}>
                    <div className="pg-reviews__top">
                      <Stars value={review.rating} />
                      <time dateTime={review.at}>{formatDate(review.at)}</time>
                    </div>
                    <p>“{review.text}”</p>
                    <span>
                      <strong>{review.by}</strong> · <span className="ad-code">{review.code}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ad-muted-text">Ulasan terbaru akan tampil di sini.</p>
            )}
          </Card>
        </div>

        <div className="pg-detail-col">
          <Card id={`${uid}-lok`} title="Lokasi" description="Titik layanan dan radius area.">
            {item.coords ? (
              <>
                <LocationMap name={item.name} city={item.city} />
                <p className="ad-address">
                  <MapPinIcon size={18} />
                  {item.address}
                </p>
                <dl className="pg-mini-dl">
                  <div>
                    <dt>Koordinat</dt>
                    <dd className="pg-mono">
                      Lat {item.coords.lat.toFixed(4)} · Long {item.coords.lng.toFixed(4)}
                    </dd>
                  </div>
                  <div>
                    <dt>Radius layanan</dt>
                    <dd>
                      <strong>{item.radiusKm} km</strong>
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <div className="ad-callout tone-orange" role="note">
                <AlertIcon size={20} strokeWidth={2.25} />
                <span>
                  <strong>Titik lokasi belum ditentukan.</strong> Penyedia tidak muncul di peta dan
                  pencarian sekitar. {item.address}
                </span>
              </div>
            )}
          </Card>

          <Card id={`${uid}-jad`} title="Jadwal Ketersediaan" description="Diatur oleh penyedia.">
            <ul className="pg-week" aria-label="Hari layanan">
              {DAYS.map(([day, short, long]) => {
                const on = item.workDays.includes(day);
                return (
                  <li key={day} className={on ? 'is-on' : undefined}>
                    <span aria-hidden="true">{short}</span>
                    {on ? (
                      <CheckIcon size={16} strokeWidth={3} aria-hidden="true" />
                    ) : (
                      <MinusIcon size={16} strokeWidth={3} aria-hidden="true" />
                    )}
                    <span className="visually-hidden">
                      {long}, {on ? 'tersedia' : 'libur'}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="pg-hours">
              <ClockIcon size={18} />
              <span>
                <strong>{item.hours}</strong> · istirahat {item.breakTime}
              </span>
            </p>
          </Card>

          <Card
            id={`${uid}-riw`}
            title="Riwayat Status Akun"
            description="Tercatat otomatis di Audit Log."
          >
            <ol className="pg-timeline">
              {history.map((entry, index) => {
                const meta = HISTORY[entry.status];
                return (
                  <li
                    key={`${entry.at}-${entry.status}`}
                    className={index === 0 ? 'is-latest' : ''}
                  >
                    <span className="pg-timeline__dot" aria-hidden="true" />
                    <div>
                      <Badge tone={meta.tone} icon={meta.icon}>
                        {meta.label}
                      </Badge>
                      <span className="pg-timeline__meta">
                        <time dateTime={entry.at}>{formatDateTime(entry.at)}</time> · oleh{' '}
                        <strong>{entry.by}</strong>
                      </span>
                      <span className="pg-timeline__reason">
                        <strong>Alasan:</strong> {entry.reason}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>

      <RevisionDialog
        open={revising}
        onClose={() => setRevising(false)}
        subject={{
          ...item,
          meta: `${item.city} · ${item.status === 'perbaikan' ? 'Perlu Perbaikan Data' : 'Terverifikasi'}`,
        }}
        defaultSections={item.coords ? [] : ['Lokasi']}
        onConfirm={confirmRevision}
      />
    </>
  );
}
