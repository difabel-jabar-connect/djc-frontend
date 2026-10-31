import { useId, useState } from 'react';
import {
  AlertIcon,
  CheckIcon,
  CircleCheckIcon,
  DashedCircleIcon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
  LaptopIcon,
  LockIcon,
  LogOutIcon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SpinnerIcon,
  XCircleIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { formatDateTime } from '@/features/admin/adminFormat';
import {
  PASSWORD_RULES,
  passwordStrength,
  validatePasswordChange,
} from '@/features/admin/settingsForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConfirmDialog } from '../AdminDialogs';
import { Badge } from '../AdminParts';
import { TextField } from '../FormFields';
import { SettingsCard } from './SettingsParts';

const EMPTY = { current: '', next: '', confirm: '' };

function PasswordField({ id, label, value, onChange, error, help, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      id={id}
      label={label}
      icon={LockIcon}
      type={visible ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      error={error}
      help={help}
      trailing={
        <button
          type="button"
          className="ad-input__toggle"
          aria-pressed={visible}
          aria-label={`Tampilkan ${label.toLowerCase()}`}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      }
    />
  );
}

function StrengthMeter({ id, value }) {
  const strength = passwordStrength(value);
  return (
    <div className="st-strength" id={id}>
      <div className="st-strength__head">
        <span>Kekuatan kata sandi</span>
        <strong className={`st-strength__label tone-${strength.tone}`}>
          {strength.label || '–'}
        </strong>
      </div>
      <div className={`st-strength__bars tone-${strength.tone}`} aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= strength.score ? 'is-on' : undefined} />
        ))}
      </div>
      <ul className="st-rules" aria-label="Syarat kata sandi">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li key={rule.id} className={met ? 'is-met' : undefined}>
              {met ? <CircleCheckIcon size={18} /> : <DashedCircleIcon size={18} />}
              {rule.label}
              <span className="visually-hidden">{met ? ' (terpenuhi)' : ' (belum)'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Pengaturan · Keamanan: ubah kata sandi + sesi aktif. */
export default function SecuritySettings() {
  useDocumentTitle('Pengaturan · Keamanan');
  const id = useId();
  const { sessions, changePassword, revokeSessions, run, notify } = useAdmin();
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const errors = submitted ? validatePasswordChange(form) : {};
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const fieldId = (key) => `${id}-${key}`;
  const matches = form.confirm !== '' && form.confirm === form.next;
  const others = sessions.filter((s) => !s.current);

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    const found = validatePasswordChange(form);
    const first = ['current', 'next', 'confirm'].find((key) => found[key]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    setSaving(true);
    await run(() => changePassword());
    setSaving(false);
    setForm(EMPTY);
    setSubmitted(false);
    notify('Kata sandi diperbarui. Sesi di perangkat lain telah dikeluarkan.');
  };

  const revokeOne = async (session) => {
    setRevoking(session.id);
    await run(() => revokeSessions(session.id));
    setRevoking(null);
    notify(`${session.device} dikeluarkan dari akun Anda.`);
  };

  const revokeAll = async () => {
    const count = others.length;
    await run(() => revokeSessions());
    setConfirmAll(false);
    notify(`${count} perangkat lain dikeluarkan dari akun Anda.`);
  };

  return (
    <>
      <SettingsCard
        id={`${id}-password`}
        title="Ubah Kata Sandi"
        description="Gunakan kata sandi yang kuat dan tidak dipakai di layanan lain."
      >
        <form className="st-password" noValidate onSubmit={submit}>
          <div className="st-password__fields">
            <PasswordField
              id={fieldId('current')}
              label="Kata Sandi Saat Ini"
              autoComplete="current-password"
              value={form.current}
              onChange={set('current')}
              error={errors.current}
            />
            <PasswordField
              id={fieldId('next')}
              label="Kata Sandi Baru"
              autoComplete="new-password"
              value={form.next}
              onChange={set('next')}
              error={errors.next}
            />
            <StrengthMeter id={`${id}-strength`} value={form.next} />
            <PasswordField
              id={fieldId('confirm')}
              label="Ulangi Kata Sandi Baru"
              autoComplete="new-password"
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
            />
            <p className="st-match" role="status">
              {form.confirm !== '' &&
                (matches ? (
                  <span className="st-match__ok">
                    <CheckIcon size={16} strokeWidth={2.5} />
                    Kata sandi cocok
                  </span>
                ) : (
                  <span className="st-match__no">
                    <XCircleIcon size={16} />
                    Kata sandi belum cocok
                  </span>
                ))}
            </p>
          </div>
          <div className="st-password__foot">
            <p className="ad-hint">
              <ShieldCheckIcon size={16} />
              Sesi di perangkat lain akan dikeluarkan setelah kata sandi diperbarui.
            </p>
            <button
              type="submit"
              className="btn btn--primary btn--md"
              disabled={saving}
              aria-busy={saving || undefined}
            >
              {saving ? <SpinnerIcon className="ad-spin" size={18} /> : <KeyIcon size={18} />}
              {saving ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
            </button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard
        id={`${id}-sessions`}
        title="Sesi Aktif"
        description="Perangkat yang sedang masuk ke akun Anda. Keluarkan perangkat yang tidak Anda kenali."
      >
        <ul className="st-sessions">
          {sessions.map((session) => {
            const Icon = session.type === 'phone' ? SmartphoneIcon : LaptopIcon;
            const busy = revoking === session.id;
            return (
              <li key={session.id} className="st-session">
                <span className="st-session__icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <span className="st-session__text">
                  <strong>
                    {session.device}
                    {session.current && (
                      <Badge tone="success" icon={CheckIcon}>
                        Perangkat ini
                      </Badge>
                    )}
                  </strong>
                  <span>
                    {session.city} ·{' '}
                    {session.current
                      ? 'Aktif sekarang'
                      : `Terakhir aktif ${formatDateTime(session.lastActiveAt)}`}
                  </span>
                </span>
                {!session.current && (
                  <button
                    type="button"
                    className="btn btn--outline btn--sm st-session__action"
                    aria-label={`Keluarkan ${session.device}`}
                    disabled={busy}
                    aria-busy={busy || undefined}
                    onClick={() => revokeOne(session)}
                  >
                    {busy ? (
                      <SpinnerIcon className="ad-spin" size={16} />
                    ) : (
                      <LogOutIcon size={16} />
                    )}
                    {busy ? 'Memproses...' : 'Keluarkan'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {others.length > 0 ? (
          <button
            type="button"
            className="btn btn--outline btn--md st-danger-outline"
            onClick={() => setConfirmAll(true)}
          >
            <LogOutIcon size={18} />
            Keluar dari Semua Perangkat Lain
          </button>
        ) : (
          <p className="ad-hint">Tidak ada perangkat lain yang sedang masuk.</p>
        )}
      </SettingsCard>

      <ConfirmDialog
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        tone="warning"
        icon={AlertIcon}
        title="Keluar dari semua perangkat lain?"
        description={`${others.length} perangkat lain akan dikeluarkan dan perlu masuk ulang. Perangkat ini tetap masuk.`}
        confirmLabel="Keluarkan Semua"
        onConfirm={revokeAll}
      />
    </>
  );
}
