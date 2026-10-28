import { useId, useState } from 'react';
import Drawer from '@/components/ui/Drawer';
import {
  BanIcon,
  HistoryIcon,
  InfoIcon,
  MailIcon,
  UserCheckIcon,
  UserIcon,
  XIcon,
} from '@/components/ui/icons';
import { AUDIT_ACTIONS, USER_STATUS } from '@/features/admin/adminData';
import { formatDate, formatDateTime, lastActiveLabel } from '@/features/admin/adminFormat';
import { Avatar, Badge, DetailList, DrawerSection, RoleBadge } from './AdminParts';

/** Detail akun (tombol "Lihat" di Kelola User): data, status, dan riwayat Audit Log. */
export default function UserDrawer({
  user,
  selfId,
  audit,
  onClose,
  onSuspend,
  onActivate,
  onResend,
}) {
  const id = useId();
  const [resentFor, setResentFor] = useState(null);
  const resent = Boolean(user) && resentFor === user.id;
  const open = Boolean(user);
  const self = user?.id === selfId;
  const status = user ? USER_STATUS[user.status] : null;
  const history = user
    ? audit
        .filter((entry) => entry.target.type === 'user' && entry.target.label === user.name)
        .slice(0, 5)
    : [];

  return (
    <Drawer open={open} onClose={onClose} labelledBy={`${id}-title`}>
      {user && (
        <>
          <div className="drawer__head">
            <div className="drawer__head-main">
              <Avatar person={user} size={64} />
              <div className="ad-drawer-id">
                <h2 id={`${id}-title`} className="drawer__title">
                  {user.name}
                  {self && <span className="ad-self"> (Anda)</span>}
                </h2>
                <div className="ad-drawer-id__meta">
                  <RoleBadge role={user.role} />
                  <Badge tone={status.tone}>{status.label}</Badge>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="drawer__close"
              aria-label="Tutup panel"
              onClick={onClose}
            >
              <XIcon size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="drawer__body">
            {user.suspension && (
              <p className="ad-callout tone-danger" role="note">
                <BanIcon size={20} strokeWidth={2.25} />
                <span>
                  <strong>
                    Disuspensi oleh {user.suspension.by} · {formatDateTime(user.suspension.at)}
                  </strong>
                  <br />
                  Alasan: {user.suspension.reason}
                </span>
              </p>
            )}
            {user.status === 'menunggu' && user.invite && (
              <div className="ad-callout tone-warning" role="note">
                <MailIcon size={20} strokeWidth={2.25} />
                <span className="ad-callout__body">
                  <span>
                    Undangan dikirim {formatDateTime(user.invite.sentAt)}. Berlaku sampai{' '}
                    {formatDateTime(user.invite.expiresAt)}.
                  </span>
                  <button
                    type="button"
                    className="btn btn--outline ad-btn-sm"
                    onClick={() => {
                      onResend(user);
                      setResentFor(user.id);
                    }}
                  >
                    <MailIcon size={18} />
                    Kirim Ulang Undangan
                  </button>
                  <span role="status" className="ad-hint">
                    {resent && 'Undangan baru terkirim. Aksi tercatat di Audit Log.'}
                  </span>
                </span>
              </div>
            )}

            <DrawerSection id={`${id}-data`} title="Data Akun" icon={UserIcon}>
              <DetailList
                rows={[
                  ['Email', user.email],
                  ['WhatsApp', user.phone || '–'],
                  ['Kota', user.city],
                  ...(user.position ? [['Jabatan', user.position]] : []),
                  ['Bergabung', formatDate(user.joinedAt)],
                  ['Terakhir aktif', lastActiveLabel(user, selfId)],
                ]}
              />
            </DrawerSection>

            <DrawerSection id={`${id}-riwayat`} title="Riwayat di Audit Log" icon={HistoryIcon}>
              {history.length ? (
                <ul className="ad-history">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <span className="ad-history__head">
                        <Badge tone={AUDIT_ACTIONS[entry.action].tone} outlined>
                          {AUDIT_ACTIONS[entry.action].label}
                        </Badge>
                        <time dateTime={entry.at}>{formatDateTime(entry.at)}</time>
                      </span>
                      <span>
                        oleh {entry.actor.name}
                        {entry.reason && ` · ${entry.reason}`}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ad-muted-text">Belum ada catatan untuk akun ini.</p>
              )}
            </DrawerSection>
          </div>

          <div className="drawer__foot">
            {self ? (
              <p className="ad-hint ad-foot-note">
                <InfoIcon size={16} />
                Ini akun Anda. Status akun sendiri tidak dapat diubah.
              </p>
            ) : user.status === 'disuspensi' ? (
              <button
                type="button"
                className="btn btn--success btn--md"
                onClick={() => onActivate(user)}
              >
                <UserCheckIcon size={18} strokeWidth={2.25} />
                Aktifkan Kembali
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--danger btn--md"
                onClick={() => onSuspend(user)}
              >
                <BanIcon size={18} strokeWidth={2.25} />
                Suspensi Akun
              </button>
            )}
            <button type="button" className="btn btn--outline btn--md" onClick={onClose}>
              Tutup
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}
