import { useEffect, useRef, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { CheckCircleIcon, KeyIcon, LinkIcon, MailIcon, PlusIcon } from '@/components/ui/icons';
import { USER_STATUS } from '@/features/admin/adminData';
import { formatDateTime } from '@/features/admin/adminFormat';
import { Badge, RoleBadge } from './AdminParts';
import { SubjectCard } from './AdminDialogs';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CopyButton({ text, label, copiedLabel, icon: Icon }) {
  const [state, setState] = useState('idle');
  return (
    <>
      <button
        type="button"
        className="btn btn--outline btn--block ad-copy"
        onClick={async () => setState((await copyText(text)) ? 'ok' : 'fail')}
      >
        <Icon size={18} strokeWidth={2.25} />
        {state === 'ok' ? copiedLabel : label}
      </button>
      <p className="ad-hint" role="status">
        {state === 'ok' && `${copiedLabel}.`}
        {state === 'fail' && 'Tidak bisa menyalin otomatis. Salin teks secara manual.'}
      </p>
    </>
  );
}

function SuccessContent({ created, onAddAnother, onDone }) {
  const titleRef = useRef(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);
  const status = USER_STATUS[created.status];

  return (
    <div className="ad-success">
      <div className="ad-success__head">
        <span className="ad-success__badge" aria-hidden="true">
          <CheckCircleIcon size={34} strokeWidth={2.25} />
        </span>
        <h2 id="account-success-title" ref={titleRef} tabIndex={-1} className="ad-dialog-title">
          Akun Berhasil Dibuat
        </h2>
      </div>

      <SubjectCard
        subject={{
          ...created,
          meta: created.email,
          extra: (
            <>
              {created.position && <span>{created.position}</span>}
              <span className="ad-subject__badges">
                <RoleBadge role={created.role} />
                <Badge tone={status.tone}>{status.label}</Badge>
              </span>
            </>
          ),
        }}
      />

      {created.invite ? (
        <div className="ad-success__box" id="account-success-desc">
          <p className="ad-success__line">
            <MailIcon size={20} />
            <span>
              Undangan telah dikirim ke <strong className="ad-nowrap">{created.email}</strong>
            </span>
          </p>
          <p className="ad-hint ad-success__indent">
            Tautan berlaku sampai {formatDateTime(created.invite.expiresAt)}.
          </p>
          <CopyButton
            text={created.invite.link}
            icon={LinkIcon}
            label="Salin Tautan Undangan"
            copiedLabel="Tautan undangan disalin"
          />
        </div>
      ) : (
        <div className="ad-success__box" id="account-success-desc">
          <p className="ad-success__line">
            <KeyIcon size={20} />
            <span>Kata sandi sementara</span>
          </p>
          <p className="ad-temp-password">
            <code>{created.tempPassword}</code>
          </p>
          <p className="ad-hint">
            Berikan kepada user secara langsung. User wajib menggantinya saat pertama masuk.
          </p>
          <CopyButton
            text={created.tempPassword}
            icon={KeyIcon}
            label="Salin Kata Sandi"
            copiedLabel="Kata sandi disalin"
          />
        </div>
      )}

      <div className="dialog__actions">
        <button type="button" className="btn btn--outline btn--md" onClick={onAddAnother}>
          <PlusIcon size={18} strokeWidth={2.25} />
          Tambah Akun Lain
        </button>
        <button type="button" className="btn btn--primary btn--md" onClick={onDone}>
          Selesai
        </button>
      </div>
    </div>
  );
}

/** Pop-up "Akun Berhasil Dibuat" (desain Tambah Akun · Sukses). */
export default function AccountSuccessDialog({ created, onAddAnother, onDone }) {
  return (
    <Dialog
      open={Boolean(created)}
      onClose={onDone}
      labelledBy="account-success-title"
      describedBy="account-success-desc"
      className="dialog--xs"
    >
      {created && <SuccessContent created={created} onAddAnother={onAddAnother} onDone={onDone} />}
    </Dialog>
  );
}
