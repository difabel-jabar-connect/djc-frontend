import { useMemo, useRef, useState } from 'react';
import {
  BanIcon,
  ChevronDownIcon,
  EyeIcon,
  InfoIcon,
  MailIcon,
  MoreVerticalIcon,
  PlusIcon,
  ResetIcon,
  ShieldIcon,
  UserCheckIcon,
  UserIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { ACCOUNT_TYPES } from '@/features/admin/accountForm';
import { USER_ROLES, USER_STATUS } from '@/features/admin/adminData';
import {
  avatarColor,
  formatDate,
  formatDateTime,
  initialsOf,
  lastActiveLabel,
} from '@/features/admin/adminFormat';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import AccountSuccessDialog from './AccountSuccessDialog';
import ActionMenu from './ActionMenu';
import AddAccountDrawer from './AddAccountDrawer';
import { ConfirmDialog, ReasonDialog } from './AdminDialogs';
import {
  Badge,
  EmptyState,
  FilterSelect,
  PageHeader,
  PersonCell,
  RoleBadge,
  SearchField,
  TableFooter,
  Tabs,
} from './AdminParts';
import { useInitialParam, usePagedList } from './usePagedList';
import UserDrawer from './UserDrawer';

const PAGE_SIZE = 10;
const TAB_FILTERS = {
  semua: () => true,
  pengguna: (u) => u.role === 'pengguna',
  penyedia: (u) => u.role === 'penyedia',
  pengelola: (u) => u.role === 'pengelola',
  disuspensi: (u) => u.status === 'disuspensi',
};
const TAB_LABELS = {
  semua: 'Semua',
  pengguna: 'Pengguna',
  penyedia: 'Penyedia',
  pengelola: 'Pengelola',
  disuspensi: 'Disuspensi',
};

/** Kelola User (desain Kelola User + Tambah Akun + Sukses + dialog Suspensi/Aktifkan). */
export default function UsersPage() {
  useDocumentTitle('Kelola User');
  const admin = useAdmin();
  const { users, audit, actor, run, notify } = admin;
  const selfId = actor.id;
  const headingRef = useRef(null);

  const [tab, setTab] = useState('semua');
  const initialQuery = useInitialParam('cari');
  const [query, setQuery] = useState(initialQuery);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');

  const [addType, setAddType] = useState(null);
  const [pendingStaff, setPendingStaff] = useState(null);
  const [created, setCreated] = useState(null);
  const [highlightId, setHighlightId] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [statusAction, setStatusAction] = useState(null);

  const viewed = users.find((u) => u.id === viewId) ?? null;
  const cityOptions = useMemo(() => [...new Set(users.map((u) => u.city))].sort(), [users]);
  const takenEmails = useMemo(() => users.map((u) => u.email.toLowerCase()), [users]);

  const q = query.trim().toLowerCase();
  const rows = users
    .filter(TAB_FILTERS[tab])
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .filter((u) => !role || u.role === role)
    .filter((u) => !status || u.status === status)
    .filter((u) => !city || u.city === city);
  const paging = usePagedList(rows, PAGE_SIZE);
  const filtered = Boolean(q || role || status || city);

  const withReset = (setter) => (value) => {
    setter(value);
    paging.resetPage();
  };
  const resetFilters = () => {
    setQuery('');
    setRole('');
    setStatus('');
    setCity('');
    paging.resetPage();
  };
  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus());

  /* ——— Tambah akun ——— */
  const createAccount = async (form) => {
    const user = await run(() => admin.createAccount(form));
    setPendingStaff(null);
    setAddType(null);
    setHighlightId(user.id);
    setTab('semua');
    resetFilters();
    setCreated(user);
  };

  const handleAddSubmit = (form) => {
    if (form.type === 'pengelola') setPendingStaff(form);
    else createAccount(form);
  };

  const finishCreated = () => {
    setCreated(null);
    notify('Akun dibuat. Aksi tercatat di Audit Log.');
    focusHeading();
  };

  /* ——— Status akun ——— */
  const confirmStatus = async (reason) => {
    const { type, user } = statusAction;
    await run(() =>
      type === 'suspend' ? admin.suspendUser(user.id, reason) : admin.activateUser(user.id, reason),
    );
    setStatusAction(null);
    setViewId(null);
    notify(
      type === 'suspend'
        ? `Akun ${user.name} disuspensi. Aksi tercatat di Audit Log.`
        : `Akun ${user.name} aktif kembali. Aksi tercatat di Audit Log.`,
    );
    focusHeading();
  };

  const resend = (user) => {
    admin.resendInvite(user.id);
    notify(`Undangan baru dikirim ke ${user.email}.`);
  };

  const rowActions = (user) => [
    { label: 'Lihat detail', icon: EyeIcon, onSelect: () => setViewId(user.id) },
    ...(user.status === 'menunggu'
      ? [{ label: 'Kirim ulang undangan', icon: MailIcon, onSelect: () => resend(user) }]
      : []),
    user.status === 'disuspensi'
      ? {
          label: 'Aktifkan kembali',
          icon: UserCheckIcon,
          tone: 'success',
          onSelect: () => setStatusAction({ type: 'activate', user }),
        }
      : {
          label: 'Suspensi akun',
          icon: BanIcon,
          tone: 'danger',
          onSelect: () => setStatusAction({ type: 'suspend', user }),
        },
  ];

  const subjectOf = (user) =>
    user && { ...user, meta: `${USER_ROLES[user.role].label} · ${user.city}` };

  return (
    <>
      <PageHeader
        headingRef={headingRef}
        title="Kelola User"
        lead="Kelola akun pengguna, penyedia, dan pengelola di platform."
      >
        <ActionMenu
          label="Tambah Akun"
          menuLabel="Pilih jenis akun"
          buttonClassName="btn btn--primary btn--md ad-split-btn"
          width={360}
          buttonContent={
            <>
              <PlusIcon size={18} strokeWidth={2.5} />
              Tambah Akun
              <span className="ad-split-btn__divider" aria-hidden="true" />
              <ChevronDownIcon size={18} strokeWidth={2.5} />
            </>
          }
          items={[
            {
              label: 'Akun Pengguna',
              description: ACCOUNT_TYPES.pengguna.menuHelp,
              icon: UserIcon,
              tone: 'navy',
              onSelect: () => setAddType('pengguna'),
            },
            {
              label: 'Akun Pengelola',
              description: ACCOUNT_TYPES.pengelola.menuHelp,
              icon: ShieldIcon,
              tone: 'indigo',
              onSelect: () => setAddType('pengelola'),
            },
          ]}
          note={
            <>
              <InfoIcon size={18} />
              Akun Penyedia dibuat melalui pendaftaran mitra dan verifikasi.
            </>
          }
        />
      </PageHeader>

      <section className="dash-card ad-list-card" aria-label="Daftar user">
        <Tabs
          label="Kelompok user"
          panelId="user-panel"
          value={tab}
          onChange={withReset(setTab)}
          tabs={Object.keys(TAB_FILTERS).map((value) => ({
            value,
            label: TAB_LABELS[value],
            count: users.filter(TAB_FILTERS[value]).length,
          }))}
        />
        <div
          id="user-panel"
          role="tabpanel"
          aria-labelledby={`user-panel-tab-${tab}`}
          className="ad-list-card__panel"
        >
          <div role="search" className="ad-filters">
            <SearchField
              label="Cari nama atau email"
              value={query}
              onChange={withReset(setQuery)}
              width={320}
            />
            <FilterSelect
              label="Peran"
              value={role}
              onChange={withReset(setRole)}
              options={[
                { value: '', label: 'Semua' },
                ...Object.entries(USER_ROLES).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                })),
              ]}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={withReset(setStatus)}
              options={[
                { value: '', label: 'Semua' },
                ...Object.entries(USER_STATUS).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                })),
              ]}
            />
            <FilterSelect
              label="Kota"
              value={city}
              onChange={withReset(setCity)}
              options={[
                { value: '', label: 'Semua' },
                ...cityOptions.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={UsersIcon}
              title="Tidak ada user untuk filter ini"
              action={
                filtered && (
                  <button type="button" className="btn btn--primary" onClick={resetFilters}>
                    <ResetIcon size={18} />
                    Reset Filter
                  </button>
                )
              }
            >
              Coba ubah kata kunci atau filter.
            </EmptyState>
          ) : (
            <>
              <div className="dash-table-wrap">
                <table className="dash-table ad-table ad-table--users">
                  <caption className="visually-hidden">Daftar user</caption>
                  <thead>
                    <tr>
                      <th scope="col">User</th>
                      <th scope="col">Peran</th>
                      <th scope="col">Kota</th>
                      <th scope="col">Status</th>
                      <th scope="col">Bergabung</th>
                      <th scope="col">Terakhir Aktif</th>
                      <th scope="col">
                        <span className="visually-hidden">Aksi</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paging.pageItems.map((user) => {
                      const self = user.id === selfId;
                      const meta = USER_STATUS[user.status];
                      return (
                        <tr
                          key={user.id}
                          className={
                            user.id === highlightId
                              ? 'ad-row--new'
                              : user.status === 'disuspensi'
                                ? 'ad-row--danger'
                                : undefined
                          }
                        >
                          <td>
                            <PersonCell
                              person={user}
                              secondary={user.email}
                              suffix={self && <span className="ad-self"> (Anda)</span>}
                            />
                          </td>
                          <td>
                            <RoleBadge role={user.role} />
                          </td>
                          <td>{user.city}</td>
                          <td>
                            <span className="ad-stack">
                              <Badge tone={meta.tone}>{meta.label}</Badge>
                              {user.status === 'menunggu' && user.invite && (
                                <span className="ad-sub">
                                  Undangan dikirim {formatDateTime(user.invite.sentAt)}
                                </span>
                              )}
                              {user.suspension && (
                                <span className="ad-sub ad-sub--danger">
                                  {user.suspension.reason}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="ad-nowrap">{formatDate(user.joinedAt)}</td>
                          <td className="ad-muted-cell">
                            {self || user.lastActiveAt ? (
                              lastActiveLabel(user, selfId)
                            ) : (
                              <>
                                <span aria-hidden="true">–</span>
                                <span className="visually-hidden">Belum pernah masuk</span>
                              </>
                            )}
                          </td>
                          <td>
                            <div className="ad-row-actions">
                              <button
                                type="button"
                                className="btn btn--outline ad-btn-sm"
                                aria-haspopup="dialog"
                                aria-label={`Lihat detail ${user.name}`}
                                onClick={() => setViewId(user.id)}
                              >
                                Lihat
                              </button>
                              <ActionMenu
                                label={`Aksi lain untuk ${user.name}`}
                                buttonClassName="ad-icon-btn"
                                buttonContent={<MoreVerticalIcon size={20} />}
                                disabled={self}
                                describedBy={self ? 'user-self-tip' : undefined}
                                items={rowActions(user)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p id="user-self-tip" className="visually-hidden">
                Akun Anda sendiri tidak dapat disuspensi dari sini.
              </p>
              <TableFooter paging={paging} noun="user" />
            </>
          )}
        </div>
      </section>

      <AddAccountDrawer
        type={addType}
        takenEmails={takenEmails}
        onClose={() => setAddType(null)}
        onSubmit={handleAddSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingStaff)}
        onClose={() => setPendingStaff(null)}
        tone="warning"
        icon={ShieldIcon}
        title="Buat akun pengelola?"
        description="Akun ini akan mendapat akses penuh ke Dashboard Admin."
        subject={
          pendingStaff && {
            name: pendingStaff.name.trim(),
            initials: initialsOf(pendingStaff.name),
            color: avatarColor(pendingStaff.name.trim()),
            meta: pendingStaff.email.trim().toLowerCase(),
            extra: <span>{pendingStaff.position.trim()}</span>,
          }
        }
        cancelLabel="Kembali"
        confirmLabel="Ya, Buat Akun"
        onConfirm={() => createAccount(pendingStaff)}
      />

      <AccountSuccessDialog
        created={created}
        onDone={finishCreated}
        onAddAnother={() => {
          const type = created.role;
          setCreated(null);
          notify('Akun dibuat. Aksi tercatat di Audit Log.');
          setAddType(type);
        }}
      />

      <UserDrawer
        user={viewed}
        selfId={selfId}
        audit={audit}
        onClose={() => setViewId(null)}
        onSuspend={(user) => setStatusAction({ type: 'suspend', user })}
        onActivate={(user) => setStatusAction({ type: 'activate', user })}
        onResend={resend}
      />

      <ReasonDialog
        open={statusAction?.type === 'suspend'}
        onClose={() => setStatusAction(null)}
        tone="danger"
        icon={BanIcon}
        title="Suspensi akun?"
        description="User tidak dapat masuk. Untuk penyedia, profil disembunyikan dari pencarian dan peta."
        subject={subjectOf(statusAction?.user)}
        confirmLabel="Ya, Suspensi"
        onConfirm={confirmStatus}
      />
      <ReasonDialog
        open={statusAction?.type === 'activate'}
        onClose={() => setStatusAction(null)}
        tone="success"
        icon={UserCheckIcon}
        title="Aktifkan kembali akun?"
        description={
          statusAction?.user.role === 'penyedia'
            ? 'User dapat masuk lagi dan profilnya tampil kembali di pencarian.'
            : 'User dapat masuk dan memesan layanan lagi.'
        }
        subject={subjectOf(statusAction?.user)}
        confirmLabel="Ya, Aktifkan"
        onConfirm={confirmStatus}
      />
    </>
  );
}
