import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { requestPasswordReset } from '@/features/auth/authApi';
import { maskEmail } from '@/features/auth/password';
import { PATHS } from '@/routes/paths';
import { MailOpenIcon } from '@/components/ui/icons';
import PasswordResetLayout from './PasswordResetLayout';

const RESEND_SECONDS = 60;

/** Kotak masuk web untuk penyedia email umum; selain itu buka aplikasi email bawaan. */
function inboxUrl(email) {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  if (domain === 'gmail.com') return 'https://mail.google.com/';
  if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain))
    return 'https://outlook.live.com/mail/';
  if (domain.startsWith('yahoo.')) return 'https://mail.yahoo.com/';
  return 'mailto:';
}

const formatCountdown = (seconds) => `00:${String(seconds).padStart(2, '0')}`;

function MailCheckArt() {
  return (
    <svg width="168" height="128" viewBox="0 0 168 128" aria-hidden="true" focusable="false">
      <circle cx="84" cy="68" r="58" fill="#e8f3fa" />
      <path
        d="M30 58 L84 24 L138 58 V112 a6 6 0 0 1 -6 6 H36 a6 6 0 0 1 -6 -6 Z"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <rect
        x="46"
        y="38"
        width="76"
        height="52"
        rx="6"
        fill="#fff"
        stroke="#c9e3f2"
        strokeWidth="2.5"
      />
      <path
        d="M58 54 H96 M58 64 H110 M58 74 H88"
        stroke="#b6d4e8"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M30 58 L84 92 L138 58"
        fill="none"
        stroke="#0b3c6e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="128" cy="34" r="20" fill="#14a3a3" stroke="#fff" strokeWidth="4" />
      <path
        d="m119 34.5 6.5 6.5 11.5-12.5"
        fill="none"
        stroke="#fff"
        strokeWidth="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 22 L24 28 L30 30 L24 32 L22 38 L20 32 L14 30 L20 28 Z" fill="#14a3a3" />
    </svg>
  );
}

/**
 * Lupa Kata Sandi · 2 — konfirmasi tautan terkirim. Email diterima lewat state navigasi
 * (tidak lewat URL). Kirim ulang aktif setelah hitung mundur 60 detik.
 */
export default function CheckEmailPage() {
  useDocumentTitle('Cek Email Anda');
  const { state } = useLocation();
  const email = state?.email ?? '';
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS - 1);
  const [resend, setResend] = useState({ state: 'idle', message: '' });

  useEffect(() => {
    if (secondsLeft <= 0) return undefined;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    setResend({ state: 'loading', message: '' });
    try {
      await requestPasswordReset(email);
      setResend({ state: 'done', message: 'Tautan baru sudah dikirim. Periksa kotak masuk Anda.' });
    } catch (error) {
      if (state?.demo && error?.code === 'ERR_NET_FAIL') {
        setResend({ state: 'done', message: 'Mode demo: tautan baru dianggap terkirim.' });
      } else {
        setResend({
          state: 'error',
          message: error?.message || 'Gagal mengirim ulang. Coba lagi nanti.',
        });
      }
    }
    setSecondsLeft(RESEND_SECONDS - 1);
  };

  const waiting = secondsLeft > 0;

  return (
    <PasswordResetLayout>
      <section className="auth-card auth-success" aria-labelledby="cek-title">
        <MailCheckArt />
        <div className="auth-success__text auth-success__text--compact">
          <h1 id="cek-title">Cek Email Anda</h1>
          <p>
            Kami telah mengirim tautan reset ke{' '}
            {email ? <strong>{maskEmail(email)}</strong> : 'email Anda'}. Tautan berlaku selama{' '}
            <strong>30 menit</strong>.
          </p>
        </div>

        <a
          href={inboxUrl(email)}
          target="_blank"
          rel="noreferrer"
          className="btn btn--outline btn--block auth-submit"
        >
          <MailOpenIcon />
          Buka Aplikasi Email
          <span className="visually-hidden"> (membuka tab baru)</span>
        </a>

        {email && (
          <div className="auth-resend">
            <p className="auth-success__resend">
              Tidak menerima email?{' '}
              <button
                type="button"
                className="auth-text-button"
                onClick={handleResend}
                disabled={waiting || resend.state === 'loading'}
                aria-describedby={waiting ? 'resend-timer' : undefined}
              >
                {resend.state === 'loading' ? 'Mengirim…' : 'Kirim ulang'}
              </button>
              {waiting && (
                <span id="resend-timer" className="auth-countdown">
                  <span className="visually-hidden">tersedia dalam </span>(
                  {formatCountdown(secondsLeft)})
                </span>
              )}
            </p>
            <p className="auth-resend__hint">Periksa juga folder Spam atau Promosi.</p>
          </div>
        )}
        {resend.message && (
          <p
            className={resend.state === 'error' ? 'field-error' : 'field-hint'}
            role={resend.state === 'error' ? 'alert' : 'status'}
          >
            {resend.message}
          </p>
        )}

        {state?.demo && (
          <p className="auth-demo-note">
            Mode demo (backend belum tersedia):{' '}
            <Link to={`${PATHS.resetPassword}?token=demo`} className="auth-link auth-link--strong">
              lanjut ke Atur Ulang Kata Sandi
            </Link>
          </p>
        )}
      </section>
    </PasswordResetLayout>
  );
}
