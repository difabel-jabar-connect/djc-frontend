import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isDev } from '@/config/env';
import { requestPasswordReset } from '@/features/auth/authApi';
import { PATHS } from '@/routes/paths';
import { AlertCircleIcon, LockIcon, MailIcon, SpinnerIcon } from '@/components/ui/icons';
import { AuthField } from './AuthFields';
import PasswordResetLayout from './PasswordResetLayout';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email.trim()) return 'Email wajib diisi.';
  if (!EMAIL_PATTERN.test(email.trim())) return 'Format email belum benar, contoh: nama@email.com.';
  return '';
}

/** Lupa Kata Sandi · 1 — minta tautan reset lewat email. */
export default function ForgotPasswordPage() {
  useDocumentTitle('Lupa Kata Sandi');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const inputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = validateEmail(email);
    if (message) {
      setError(message);
      inputRef.current?.focus();
      return;
    }

    const address = email.trim();
    setStatus({ state: 'loading', message: '' });
    try {
      await requestPasswordReset(address);
      navigate(PATHS.forgotPasswordSent, { state: { email: address } });
    } catch (err) {
      if (err?.status === 404) {
        setStatus({ state: 'idle', message: '' });
        setError(
          <>
            Email tidak terdaftar.{' '}
            <Link to={PATHS.register} className="auth-link auth-link--strong">
              Daftar akun
            </Link>
          </>,
        );
        inputRef.current?.focus();
      } else if (isDev && err?.code === 'ERR_NET_FAIL') {
        // Backend belum berjalan: lanjutkan alur sebagai demo agar layar berikutnya bisa dicoba.
        navigate(PATHS.forgotPasswordSent, { state: { email: address, demo: true } });
      } else {
        setStatus({
          state: 'error',
          message: err?.message || 'Terjadi kesalahan. Silakan coba lagi.',
        });
      }
    }
  };

  const loading = status.state === 'loading';

  return (
    <PasswordResetLayout>
      <form className="auth-card" aria-labelledby="form-title" noValidate onSubmit={handleSubmit}>
        <div className="auth-card__head auth-card__head--center">
          <span className="auth-card__icon" aria-hidden="true">
            <LockIcon size={30} strokeWidth={2} />
          </span>
          <h1 id="form-title">Lupa Kata Sandi?</h1>
          <p>
            Masukkan email yang terdaftar, kami akan mengirimkan tautan untuk mengatur ulang kata
            sandi.
          </p>
        </div>

        {status.state === 'error' && (
          <p className="auth-alert" role="alert">
            {status.message}
          </p>
        )}

        <AuthField
          id="email"
          label="Email"
          icon={MailIcon}
          error={
            error && (
              <span className="field-error__row">
                <AlertCircleIcon size={18} strokeWidth={2.25} />
                <span>{error}</span>
              </span>
            )
          }
        >
          {({ describedBy, invalid }) => (
            <input
              ref={inputRef}
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="contoh@email.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (error) setError(validateEmail(event.target.value) || null);
              }}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            />
          )}
        </AuthField>

        <button
          type="submit"
          className="btn btn--primary btn--block auth-submit"
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? (
            <>
              <SpinnerIcon className="spin" />
              Memproses…
            </>
          ) : (
            'Kirim Tautan Reset'
          )}
        </button>

        <p className="auth-card__foot auth-card__foot--inline">
          Ingat kata sandi Anda?{' '}
          <Link to={PATHS.login} className="auth-link auth-link--strong">
            Masuk
          </Link>
        </p>
      </form>
    </PasswordResetLayout>
  );
}
