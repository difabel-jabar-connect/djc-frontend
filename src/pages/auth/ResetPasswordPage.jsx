import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isDev } from '@/config/env';
import { resetPassword } from '@/features/auth/authApi';
import { checkPasswordRequirements } from '@/features/auth/password';
import { PATHS } from '@/routes/paths';
import {
  AlertCircleIcon,
  CheckIcon,
  ClockSmallIcon,
  DashedCircleIcon,
  KeyIcon,
  LockIcon,
  MinusLineIcon,
  RotateCcwIcon,
  SpinnerIcon,
} from '@/components/ui/icons';
import { PasswordField } from './AuthFields';
import PasswordResetLayout from './PasswordResetLayout';

function RequirementCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#16a34a" />
      <path
        d="m7.5 12.5 3 3 6-6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Meter kekuatan + daftar syarat (ikon + teks, tidak hanya warna). */
function PasswordRequirements({ check }) {
  return (
    <div className="pw-check">
      <div className="strength" aria-live="polite">
        <div className={`strength__bars strength__bars--${check.tone}`} aria-hidden="true">
          {[1, 2, 3].map((level) => (
            <span key={level} className={level <= check.score ? 'is-on' : undefined} />
          ))}
        </div>
        <span className={`strength__text strength__text--${check.tone}`}>
          Kekuatan:{' '}
          {check.tone === 'strong' ? (
            <CheckIcon size={16} strokeWidth={2.75} />
          ) : (
            check.score > 0 && <MinusLineIcon size={16} strokeWidth={2.75} />
          )}
          <strong>{check.label}</strong>
        </span>
      </div>
      <ul className="pw-check__list" aria-label="Syarat kata sandi">
        {check.items.map((item) => (
          <li key={item.key} className={item.met ? 'is-met' : undefined}>
            {item.met ? <RequirementCheck /> : <DashedCircleIcon size={18} />}
            <span>{item.label}</span>
            <span className="pw-check__state">{item.met ? 'Terpenuhi' : 'Belum'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lupa Kata Sandi · 3 — atur kata sandi baru dari tautan email (`?token=`). */
export default function ResetPasswordPage() {
  useDocumentTitle('Atur Ulang Kata Sandi');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState({ state: token ? 'idle' : 'expired', message: '' });

  const check = checkPasswordRequirements(password);
  const matches = confirm.length > 0 && confirm === password;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = check.valid && matches;
  const loading = status.state === 'loading';

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || loading) return;
    setStatus({ state: 'loading', message: '' });
    try {
      await resetPassword({ token, password });
      navigate(PATHS.resetPasswordSuccess, { replace: true });
    } catch (error) {
      if (error?.status === 410 || error?.status === 400) {
        setStatus({ state: 'expired', message: '' });
      } else if (isDev && token === 'demo' && error?.code === 'ERR_NET_FAIL') {
        navigate(PATHS.resetPasswordSuccess, { replace: true });
      } else {
        setStatus({
          state: 'error',
          message: error?.message || 'Terjadi kesalahan. Silakan coba lagi.',
        });
      }
    }
  };

  return (
    <PasswordResetLayout>
      <form
        className="auth-card auth-card--reset"
        aria-labelledby="form-title"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="auth-card__head auth-card__head--center">
          <span className="auth-card__icon" aria-hidden="true">
            <KeyIcon size={30} />
          </span>
          <h1 id="form-title">Atur Ulang Kata Sandi</h1>
          <p>Masukkan kata sandi baru Anda dan Anda siap menggunakan akun kembali.</p>
        </div>

        {status.state === 'expired' && (
          <div className="auth-expired" role="alert">
            <div className="auth-expired__text">
              <ClockSmallIcon size={20} strokeWidth={2.25} />
              <span>
                <strong>Tautan sudah kedaluwarsa</strong>
                Tautan reset hanya berlaku 30 menit. Minta tautan baru untuk melanjutkan.
              </span>
            </div>
            <Link to={PATHS.forgotPassword} className="btn btn--primary btn--block">
              <RotateCcwIcon size={18} strokeWidth={2.25} />
              Kirim Ulang Tautan
            </Link>
          </div>
        )}

        {status.state === 'error' && (
          <p className="auth-alert" role="alert">
            {status.message}
          </p>
        )}

        <PasswordField
          id="sandi-baru"
          label="Kata Sandi Baru"
          toggleLabel="Tampilkan kata sandi"
          placeholder={`Minimal 8 karakter`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          help={<PasswordRequirements check={check} />}
        />

        <PasswordField
          id="sandi-ulang"
          label="Konfirmasi Kata Sandi Baru"
          toggleLabel="Tampilkan konfirmasi kata sandi"
          placeholder="Ulangi kata sandi baru"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={
            mismatch && (
              <span className="field-error__row">
                <AlertCircleIcon size={18} strokeWidth={2.25} />
                Kata sandi tidak sama
              </span>
            )
          }
          help={
            matches && (
              <p className="pw-match" role="status">
                <CheckIcon size={16} strokeWidth={2.75} />
                Kata sandi cocok
              </p>
            )
          }
        />

        <button
          type="submit"
          className="btn btn--primary btn--block auth-submit"
          disabled={!canSubmit || loading || status.state === 'expired'}
          aria-busy={loading}
          aria-describedby={canSubmit ? undefined : 'submit-hint'}
        >
          {loading ? (
            <>
              <SpinnerIcon className="spin" />
              Memproses…
            </>
          ) : (
            <>
              {!canSubmit && <LockIcon size={18} strokeWidth={2} />}
              Simpan Kata Sandi
            </>
          )}
        </button>
        {!canSubmit && (
          <p id="submit-hint" className="auth-submit-hint">
            Tombol aktif setelah semua syarat terpenuhi dan konfirmasi cocok.
          </p>
        )}
      </form>
    </PasswordResetLayout>
  );
}
