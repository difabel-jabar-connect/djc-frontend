import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { isDev } from '@/config/env';
import { useAuth } from '@/context/useAuth';
import { DEMO_ACCOUNTS, homePathFor } from '@/features/auth/session';
import { login } from '@/features/auth/authApi';
import { safeRedirectPath } from '@/features/auth/redirect';
import { PATHS } from '@/routes/paths';
import {
  EyeIcon,
  EyeOffIcon,
  GoogleMarkIcon,
  HeartIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  ShieldCheckIcon,
} from '@/components/ui/icons';
import AuthIntro, { AuthPageFooter } from './AuthIntro';
import './auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_ROLES = [
  { key: 'customer', label: 'Pelanggan' },
  { key: 'provider', label: 'Penyedia' },
  { key: 'admin', label: 'Pengelola' },
];

const HIGHLIGHTS = [
  { text: 'Penyedia terverifikasi', icon: ShieldCheckIcon },
  { text: 'Layanan di seluruh Jawa Barat', icon: MapPinIcon },
  { text: 'Ramah & aksesibel untuk semua', icon: HeartIcon },
];

function validate({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email wajib diisi.';
  else if (!EMAIL_PATTERN.test(email.trim()))
    errors.email = 'Format email belum benar, contoh: nama@email.com.';
  if (!password) errors.sandi = 'Kata sandi wajib diisi.';
  return errors;
}

/** Halaman Masuk (SP1-04) — Customer, Provider, dan Admin memakai form yang sama. */
export default function LoginPage() {
  useDocumentTitle('Masuk');
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const fieldRefs = { email: useRef(null), sandi: useRef(null) };

  const update = (key) => (event) => {
    const value = key === 'remember' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    if (Object.keys(errors).length) {
      setErrors(validate({ ...form, [key]: value }));
    }
  };

  /** Kembali ke halaman tujuan (`?next=`) atau halaman awal sesuai peran. */
  const goAfterLogin = (sessionUser) => {
    const next = searchParams.get('next');
    navigate(next ? safeRedirectPath(next) : homePathFor(sessionUser?.role), { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus();
      return;
    }

    setStatus({ state: 'loading', message: '' });
    try {
      const data = await login({
        email: form.email.trim(),
        password: form.password,
        remember: form.remember,
      });
      const sessionUser = signIn(data?.user ?? data);
      goAfterLogin(sessionUser);
    } catch (error) {
      const message =
        error?.status === 401
          ? 'Email atau kata sandi salah. Periksa kembali lalu coba lagi.'
          : error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      setStatus({ state: 'error', message });
    }
  };

  const loading = status.state === 'loading';

  return (
    <div className="auth-page">
      <AuthIntro
        title="Selamat Datang Kembali!"
        text="Masuk untuk menemukan layanan terpercaya atau mengelola layanan Anda bersama Difabel Jabar Connect."
        highlights={HIGHLIGHTS}
      />

      <main id="main-content" tabIndex={-1} className="auth-main">
        <form className="auth-card" aria-labelledby="form-title" noValidate onSubmit={handleSubmit}>
          <div className="auth-card__head">
            <h2 id="form-title">Masuk ke Akun Anda</h2>
            <p>Silakan masukkan email dan kata sandi Anda.</p>
          </div>

          {status.state === 'error' && (
            <p className="auth-alert" role="alert">
              {status.message}
            </p>
          )}

          <div className="field">
            <label htmlFor="email" className="auth-label">
              Email{' '}
              <span className="auth-required" aria-hidden="true">
                *
              </span>
            </label>
            <div className={`auth-input${errors.email ? ' auth-input--invalid' : ''}`}>
              <MailIcon className="auth-input__icon" />
              <input
                ref={fieldRefs.email}
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                placeholder="contoh@email.com"
                value={form.email}
                onChange={update('email')}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="field-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="field">
            <label htmlFor="sandi" className="auth-label">
              Kata Sandi{' '}
              <span className="auth-required" aria-hidden="true">
                *
              </span>
            </label>
            <div
              className={`auth-input auth-input--action${errors.sandi ? ' auth-input--invalid' : ''}`}
            >
              <LockIcon strokeWidth={2} className="auth-input__icon" />
              <input
                ref={fieldRefs.sandi}
                id="sandi"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                placeholder="Masukkan kata sandi"
                value={form.password}
                onChange={update('password')}
                aria-invalid={Boolean(errors.sandi)}
                aria-describedby={errors.sandi ? 'sandi-error' : undefined}
              />
              <button
                type="button"
                className="auth-input__toggle"
                aria-label="Tampilkan kata sandi"
                aria-pressed={showPassword}
                aria-controls="sandi"
                onClick={() => setShowPassword((shown) => !shown)}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {errors.sandi && (
              <p id="sandi-error" className="field-error">
                {errors.sandi}
              </p>
            )}
          </div>

          <div className="auth-card__row">
            <label htmlFor="ingat" className="auth-check">
              <input
                id="ingat"
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={update('remember')}
              />
              Ingat saya
            </label>
            <Link to={PATHS.forgotPassword} className="auth-link">
              Lupa kata sandi?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--block auth-submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>

          <div className="auth-divider" aria-hidden="true">
            atau
          </div>

          <button
            type="button"
            className="auth-google"
            onClick={() =>
              setStatus({
                state: 'info',
                message:
                  'Masuk dengan Google belum tersedia. Silakan gunakan email dan kata sandi.',
              })
            }
          >
            <GoogleMarkIcon />
            Masuk dengan Google
          </button>
          {status.state === 'info' && (
            <p className="field-hint auth-info" role="status">
              {status.message}
            </p>
          )}

          <div className="auth-card__foot">
            <p>
              Belum punya akun?{' '}
              <Link to={PATHS.register} className="auth-link auth-link--strong">
                Daftar sekarang
              </Link>
            </p>
            <p>
              Alumni PPSGHD?{' '}
              <Link to={`${PATHS.register}?peran=mitra`} className="auth-link auth-link--strong">
                Daftar sebagai Mitra
              </Link>
            </p>
          </div>
        </form>

        {/* Backend auth belum tersedia: akun demo hanya muncul di mode development. */}
        {isDev && (
          <section className="auth-demo" aria-labelledby="demo-title">
            <h2 id="demo-title">Akun demo (mode development)</h2>
            <p>Masuk tanpa backend untuk mencoba tampilan tiap peran.</p>
            <ul>
              {DEMO_ROLES.map(({ key, label }) => (
                <li key={key}>
                  <button
                    type="button"
                    className="btn btn--outline btn--block"
                    onClick={() => goAfterLogin(signIn(DEMO_ACCOUNTS[key]))}
                  >
                    {label}
                    <span className="auth-demo__name">{DEMO_ACCOUNTS[key].name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <AuthPageFooter />
      </main>
    </div>
  );
}
