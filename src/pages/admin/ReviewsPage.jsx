import { useMemo, useRef, useState } from 'react';
import RatingStars from '@/components/ui/RatingStars';
import {
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  FlagIcon,
  MessageStarIcon,
  ResetIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { REVIEW_STATUS } from '@/features/admin/adminData';
import { DATE_RANGE_OPTIONS, formatDateTime, inDateRange } from '@/features/admin/adminFormat';
import { formatRating } from '@/lib/format';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ReasonDialog } from './AdminDialogs';
import {
  Avatar,
  Badge,
  EmptyState,
  FilterSelect,
  PageHeader,
  SearchField,
  TableFooter,
  Tabs,
} from './AdminParts';
import { useInitialParam, usePagedList } from './usePagedList';

const PAGE_SIZE = 5;
const TABS = [
  { value: 'semua', label: 'Semua' },
  { value: 'dilaporkan', label: 'Dilaporkan', countOf: 'dilaporkan' },
  { value: 'ditampilkan', label: 'Ditampilkan' },
  { value: 'disembunyikan', label: 'Disembunyikan', countOf: 'disembunyikan' },
];

const DIALOGS = {
  hide: {
    tone: 'danger',
    icon: EyeOffIcon,
    title: 'Sembunyikan ulasan?',
    description: 'Ulasan tidak tampil di profil penyedia. Penulis ulasan diberi tahu.',
    confirmLabel: 'Ya, Sembunyikan',
    done: 'disembunyikan',
  },
  show: {
    tone: 'success',
    icon: EyeIcon,
    title: 'Tampilkan lagi ulasan?',
    description: 'Ulasan tampil kembali di profil penyedia.',
    confirmLabel: 'Ya, Tampilkan',
    done: 'ditampilkan lagi',
  },
  dismiss: {
    tone: 'success',
    icon: FlagIcon,
    title: 'Abaikan laporan?',
    description: 'Laporan ditutup dan ulasan tetap tampil di profil penyedia.',
    confirmLabel: 'Ya, Abaikan Laporan',
    done: 'tetap ditampilkan, laporan diabaikan',
  },
};

/** Moderasi Ulasan (desain Moderasi Ulasan + dialog Sembunyikan). */
export default function ReviewsPage() {
  useDocumentTitle('Moderasi Ulasan');
  const { reviews, hideReview, showReview, dismissReport, run, notify } = useAdmin();
  const headingRef = useRef(null);
  const initialTab = useInitialParam('tab', 'semua');
  const initialQuery = useInitialParam('cari');
  const [tab, setTab] = useState(TABS.some((t) => t.value === initialTab) ? initialTab : 'semua');
  const [query, setQuery] = useState(initialQuery);
  const [rating, setRating] = useState('');
  const [provider, setProvider] = useState('');
  const [range, setRange] = useState('');
  const [action, setAction] = useState(null); // { type, review }

  const providers = useMemo(() => [...new Set(reviews.map((r) => r.provider))].sort(), [reviews]);
  const q = query.trim().toLowerCase();
  const rows = reviews
    .filter((r) => tab === 'semua' || r.status === tab)
    .filter(
      (r) =>
        !q ||
        r.text.toLowerCase().includes(q) ||
        r.author.name.toLowerCase().includes(q) ||
        r.bookingCode.toLowerCase().includes(q),
    )
    .filter((r) => !rating || r.rating === Number(rating))
    .filter((r) => !provider || r.provider === provider)
    .filter((r) => inDateRange(r.createdAt, range))
    .sort((a, b) => {
      // Laporan selalu di atas, lalu terbaru.
      const reported = Number(b.status === 'dilaporkan') - Number(a.status === 'dilaporkan');
      return reported || new Date(b.createdAt) - new Date(a.createdAt);
    });
  const paging = usePagedList(rows, PAGE_SIZE);
  const filtered = Boolean(q || rating || provider || range);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };
  const resetFilters = () => {
    setQuery('');
    setRating('');
    setProvider('');
    setRange('');
    paging.resetPage();
  };

  const dialog = action && DIALOGS[action.type];
  const runAction = { hide: hideReview, show: showReview, dismiss: dismissReport };

  return (
    <>
      <PageHeader
        headingRef={headingRef}
        title="Moderasi Ulasan"
        lead="Jaga ulasan tetap jujur, sopan, dan relevan."
      />

      <section className="dash-card ad-list-card" aria-label="Filter ulasan">
        <Tabs
          label="Status ulasan"
          panelId="ulasan-panel"
          value={tab}
          onChange={withReset(setTab)}
          tabs={TABS.map((t) => ({
            value: t.value,
            label: t.label,
            count: t.countOf ? reviews.filter((r) => r.status === t.countOf).length : undefined,
          }))}
        />
        <div role="search" className="ad-filters">
          <SearchField
            label="Cari isi ulasan, pengguna, atau kode"
            value={query}
            onChange={withReset(setQuery)}
            width={320}
          />
          <FilterSelect
            label="Rating"
            value={rating}
            onChange={withReset(setRating)}
            options={[
              { value: '', label: 'Semua' },
              ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} bintang` })),
            ]}
          />
          <FilterSelect
            label="Penyedia"
            value={provider}
            onChange={withReset(setProvider)}
            options={[
              { value: '', label: 'Semua' },
              ...providers.map((p) => ({ value: p, label: p })),
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
      </section>

      <div id="ulasan-panel" role="tabpanel" aria-labelledby={`ulasan-panel-tab-${tab}`}>
        {rows.length === 0 ? (
          <div className="dash-card">
            <EmptyState
              icon={MessageStarIcon}
              title={filtered ? 'Tidak ada ulasan untuk filter ini' : 'Belum ada ulasan di sini'}
              action={
                filtered && (
                  <button type="button" className="btn btn--primary" onClick={resetFilters}>
                    <ResetIcon size={18} />
                    Reset Filter
                  </button>
                )
              }
            >
              {filtered ? 'Coba ubah kata kunci, rating, atau tanggal.' : null}
            </EmptyState>
          </div>
        ) : (
          <>
            <ul className="ad-reviews" aria-label="Daftar ulasan">
              {paging.pageItems.map((review) => {
                const status = REVIEW_STATUS[review.status];
                return (
                  <li
                    key={review.id}
                    className={`dash-card ad-review${review.status === 'dilaporkan' ? ' ad-review--reported' : ''}`}
                  >
                    {review.status === 'dilaporkan' && (
                      <p className="ad-callout tone-warning">
                        <FlagIcon size={18} strokeWidth={2.25} />
                        Dilaporkan oleh penyedia: {review.report}
                      </p>
                    )}
                    <div className="ad-review__top">
                      <span className="ad-review__rating">
                        <RatingStars value={review.rating} />
                        <strong>{formatRating(review.rating)}</strong>
                      </span>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <p
                      className={`ad-review__text${review.status === 'disembunyikan' ? ' ad-review__text--hidden' : ''}`}
                    >
                      “{review.text}”
                    </p>
                    {review.status === 'disembunyikan' && review.moderation && (
                      <p className="ad-callout tone-neutral">
                        <EyeOffIcon size={18} strokeWidth={2.25} />
                        <span>
                          Disembunyikan oleh {review.moderation.by} ·{' '}
                          {formatDateTime(review.moderation.at)} · Alasan:{' '}
                          {review.moderation.reason}
                        </span>
                      </p>
                    )}
                    <div className="ad-review__foot">
                      <div className="ad-review__meta">
                        <span className="ad-person">
                          <Avatar person={review.author} size={32} />
                          <strong>{review.author.name}</strong>
                        </span>
                        <span>
                          untuk <strong>{review.provider}</strong> · {review.category}
                        </span>
                        <span className="ad-code">{review.bookingCode}</span>
                        <time dateTime={review.createdAt}>{formatDateTime(review.createdAt)}</time>
                      </div>
                      <div className="ad-review__actions">
                        {review.status === 'dilaporkan' && (
                          <button
                            type="button"
                            className="btn btn--outline ad-btn-md"
                            aria-haspopup="dialog"
                            aria-label={`Abaikan laporan ulasan ${review.bookingCode}`}
                            onClick={() => setAction({ type: 'dismiss', review })}
                          >
                            <FlagIcon size={18} strokeWidth={2.25} />
                            Abaikan Laporan
                          </button>
                        )}
                        {review.status === 'disembunyikan' ? (
                          <button
                            type="button"
                            className="btn ad-btn-md ad-btn-success-outline"
                            aria-haspopup="dialog"
                            aria-label={`Tampilkan lagi ulasan ${review.bookingCode}`}
                            onClick={() => setAction({ type: 'show', review })}
                          >
                            <EyeIcon size={18} strokeWidth={2.25} />
                            Tampilkan Lagi
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn--danger ad-btn-md"
                            aria-haspopup="dialog"
                            aria-label={`Sembunyikan ulasan ${review.bookingCode}`}
                            onClick={() => setAction({ type: 'hide', review })}
                          >
                            <EyeOffIcon size={18} strokeWidth={2.25} />
                            Sembunyikan
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <TableFooter paging={paging} noun="ulasan" />
          </>
        )}
      </div>

      <ReasonDialog
        open={Boolean(action)}
        onClose={() => setAction(null)}
        tone={dialog?.tone ?? 'danger'}
        icon={dialog?.icon ?? EyeOffIcon}
        title={dialog?.title}
        description={dialog?.description}
        subject={
          action && {
            ...action.review.author,
            name: `Ulasan ${action.review.author.name} · ${action.review.bookingCode}`,
            meta: `Untuk ${action.review.provider} · ${action.review.category}`,
          }
        }
        confirmLabel={dialog?.confirmLabel}
        onConfirm={async (reason) => {
          const { type, review } = action;
          await run(() => runAction[type](review.id, reason));
          setAction(null);
          notify(`Ulasan ${review.bookingCode} ${DIALOGS[type].done}. Aksi tercatat di Audit Log.`);
          requestAnimationFrame(() => headingRef.current?.focus());
        }}
      />
    </>
  );
}
