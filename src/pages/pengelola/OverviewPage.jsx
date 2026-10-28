import { Link } from 'react-router';
import { BarChart, DonutProgress } from '@/components/dashboard/charts';
import {
  AlertIcon,
  BriefcaseIcon,
  CheckIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  ClockIcon,
  EyeOffIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { AUDIT_ACTIONS } from '@/features/admin/adminData';
import { formatDateTime, hoursSince } from '@/features/admin/adminFormat';
import { MONTHLY_ORDERS, REGIONS } from '@/features/pengelola/pengelolaData';
import { programKpis } from '@/features/pengelola/reportData';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS, buildAdminPath } from '@/routes/paths';
import { AuditActionIcon, Badge, PageHeader } from '../admin/AdminParts';
import { SummaryTiles } from './PengelolaParts';

const MONTH_LABELS = ['Jan', '', 'Mar', '', 'Mei', '', 'Jul', '', 'Sep', 'Okt'];

/**
 * Ringkasan Panel Pengelola: KPI program, daftar tindakan, tren pesanan, dan aktivitas.
 * (Desain Ringkasan belum tersedia; disusun dari komponen desain Pengelola lain.)
 */
export default function OverviewPage() {
  useDocumentTitle('Ringkasan');
  const { actor, verifications, orders, alumni, services, audit } = useAdmin();
  const kpi = programKpis(REGIONS);
  const firstName = actor.name.split(' ')[0];

  const todo = [
    {
      label: 'Pendaftaran menunggu verifikasi',
      count: verifications.filter((v) => v.status === 'menunggu').length,
      to: PATHS.pengelolaVerification,
      icon: ShieldCheckIcon,
      tone: 'warning',
    },
    {
      label: 'Perbaikan data sudah dikirim ulang',
      count: verifications.filter((v) => v.status === 'perbaikan' && v.revision?.resubmitted)
        .length,
      to: buildAdminPath(PATHS.pengelolaVerification, { tab: 'perbaikan' }),
      icon: CheckIcon,
      tone: 'success',
    },
    {
      label: 'Pesanan Menunggu lebih dari 20 jam',
      count: orders.filter((o) => o.status === 'menunggu' && hoursSince(o.createdAt) > 20).length,
      to: PATHS.pengelolaOrders,
      icon: ClockIcon,
      tone: 'warning',
    },
    {
      label: 'Penyedia tanpa titik lokasi',
      count: alumni.filter((a) => !a.coords).length,
      to: PATHS.pengelolaRegions,
      icon: MapPinIcon,
      tone: 'orange',
    },
    {
      label: 'Layanan disembunyikan',
      count: services.filter((s) => s.status === 'disembunyikan').length,
      to: PATHS.pengelolaServices,
      icon: EyeOffIcon,
      tone: 'neutral',
    },
  ];

  return (
    <>
      <PageHeader
        title={`Halo, ${firstName}`}
        lead="Ringkasan program pemberdayaan alumni UPTD PPSGHD Jawa Barat."
      />

      <SummaryTiles
        label="Indikator program"
        columns={4}
        items={[
          { label: 'Alumni Terverifikasi', value: kpi.verified, icon: CheckIcon, tone: 'success' },
          { label: 'Layanan Aktif', value: kpi.activeServices, icon: BriefcaseIcon, tone: 'teal' },
          { label: 'Total Pesanan 2026', value: kpi.totalOrders, icon: ClipboardListIcon },
          {
            label: 'Kota/Kabupaten Terjangkau',
            value: kpi.reached,
            suffix: `dari ${kpi.regionCount}`,
            icon: MapPinIcon,
            tone: 'teal',
          },
        ]}
      />

      <div className="pg-overview-grid">
        <section className="dash-card pg-card" aria-labelledby="pg-todo">
          <div className="pg-card__head">
            <div>
              <h2 id="pg-todo" className="pg-card__title">
                Perlu Tindakan
              </h2>
              <p className="pg-card__desc">Hal yang menunggu tindak lanjut pengelola.</p>
            </div>
          </div>
          <ul className="pg-todo">
            {todo.map(({ label, count, to, icon: Icon, tone }) => (
              <li key={label}>
                <Link to={to} className={count ? undefined : 'is-done'}>
                  <span
                    className={`pg-tile__icon tone-${count ? tone : 'success'}`}
                    aria-hidden="true"
                  >
                    {count ? <Icon size={18} strokeWidth={2.25} /> : <CheckIcon size={18} />}
                  </span>
                  <span className="pg-todo__label">{label}</span>
                  <strong>{count}</strong>
                  <ChevronRightIcon size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="dash-card pg-card" aria-labelledby="pg-trend">
          <div className="pg-card__head">
            <div>
              <h2 id="pg-trend" className="pg-card__title">
                Pesanan per Bulan
              </h2>
              <p className="pg-card__desc">Januari – Oktober 2026, seluruh platform.</p>
            </div>
          </div>
          <BarChart
            data={MONTHLY_ORDERS}
            max={200}
            ticks={[0, 100, 200]}
            labels={MONTH_LABELS}
            width={480}
            height={220}
            ariaLabel={`Pesanan per bulan Januari sampai Oktober 2026: ${MONTHLY_ORDERS.join(', ')}`}
          />
          <div className="pg-target">
            <DonutProgress
              percent={kpi.targetPercent}
              size={84}
              label={`Capaian target ${kpi.targetPercent} persen`}
            />
            <p>
              <strong>Capaian target 2026</strong>
              <br />
              {kpi.targetValue.toLocaleString('id-ID')} dari{' '}
              {kpi.targetGoal.toLocaleString('id-ID')} alumni aktif · tinggal{' '}
              {(kpi.targetGoal - kpi.targetValue).toLocaleString('id-ID')} lagi.
            </p>
          </div>
        </section>
      </div>

      <section className="dash-card pg-card" aria-labelledby="pg-activity">
        <div className="pg-card__head">
          <div>
            <h2 id="pg-activity" className="pg-card__title">
              Aktivitas Terbaru
            </h2>
            <p className="pg-card__desc">Tindakan pengelola dan sistem, tercatat di Audit Log.</p>
          </div>
          <Link to={PATHS.adminAudit} className="pg-card__link">
            Lihat Audit Log →
          </Link>
        </div>
        <ul className="pg-activity">
          {audit.slice(0, 5).map((entry) => {
            const meta = AUDIT_ACTIONS[entry.action] ?? { label: entry.action, tone: 'neutral' };
            return (
              <li key={entry.id}>
                <span className={`pg-tile__icon tone-${meta.tone}`} aria-hidden="true">
                  <AuditActionIcon action={entry.action} size={18} />
                </span>
                <span className="pg-activity__text">
                  <span>
                    <strong>{entry.actor.name}</strong> ·{' '}
                    <Badge tone={meta.tone}>{meta.label}</Badge> {entry.target.label}
                  </span>
                  <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                </span>
              </li>
            );
          })}
          {!audit.length && (
            <li className="ad-muted-text">
              <AlertIcon size={18} /> Belum ada aktivitas.
            </li>
          )}
        </ul>
      </section>
    </>
  );
}
