import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { resendVerification } from '@/features/auth/authApi';
import { maskEmail } from '@/features/auth/password';
import { PATHS } from '@/routes/paths';
import { ArrowRightIcon, ClockSmallIcon } from '@/components/ui/icons';
import AuthIntro, { AuthPageFooter } from './AuthIntro';
import './auth.css';

function MailSentArt() {
  return (
    <svg width="180" height="136" viewBox="0 0 180 136" aria-hidden="true" focusable="false">
      <circle cx="90" cy="70" r="64" fill="#e8f3fa" />
      <rect
        x="34"
        y="40"
        width="112"
        height="76"
        rx="10"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3"
      />
      <path
        d="M36 44 L90 84 L144 44"
        fill="none"
        stroke="#0b3c6e"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M36 114 L74 78 M144 114 L106 78"
        stroke="#c9e3f2"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="138" cy="40" r="22" fill="#16a34a" stroke="#fff" strokeWidth="4" />
      <path
        d="m128 40.5 7 7 13-14"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M26 22 L28 28 L34 30 L28 32 L26 38 L24 32 L18 30 L24 28 Z" fill="#14a3a3" />
      <circle cx="164" cy="98" r="5" fill="#b6d4e8" />
    </svg>
  );
}

/**
 * Pendaftaran Berhasil. Email & peran diterima dari halaman Daftar lewat state navigasi
 * (tidak lewat URL agar email tidak tersimpan di riwayat). Kotak "Khusus Mitra" hanya
 * untuk pendaftar Mitra.
 */
export default function RegisterSuccessPage() {
  useDocumentTitle('Pendaftaran Berhasil');
  const { state } = useLocation();
  const email = state?.email ?? '';
  const isMitra = state?.role === 'mitra';
  const [resend, setResend] = useState({ state: 'idle', message: '' });

  const handleResend = async () => {
    setResend({ state: 'loading', message: '' });
    try {
      await resendVerification(email);
      setResend({
        state: 'done',
        message: 'Email verifikasi sudah dikirim ulang. Periksa juga folder Spam.',
      });
    } catch (error) {
      setResend({
        state: 'error',
        message: error?.message || 'Gagal mengirim ulang. Coba lagi nanti.',
      });
    }
  };

  return (
    <div className="auth-page">
      <AuthIntro
        titleAs="p"
        title="Selamat bergabung!"
        text="Satu langkah lagi untuk mulai terhubung dengan masyarakat dan alumni difabel di Jawa Barat."
      />

      <main id="main-content" tabIndex={-1} className="auth-main">
        <section className="auth-card auth-card--wide auth-success" aria-labelledby="sukses-title">
          <MailSentArt />
          <div className="auth-success__text">
            <h1 id="sukses-title">Pendaftaran Berhasil!</h1>
            <p>
              Kami telah mengirim tautan verifikasi ke email Anda.{' '}
              {email ? (
                <>
                  Buka email <strong>{maskEmail(email)}</strong> untuk mengaktifkan akun.
                </>
              ) : (
                'Buka email tersebut untuk mengaktifkan akun.'
              )}
            </p>
          </div>

          {isMitra && (
            <div className="auth-pending" role="status">
              <ClockSmallIcon size={20} className="auth-pending__icon" />
              <span>
                <strong>Khusus Mitra Penyedia Layanan</strong>
                Akun Anda sedang menunggu verifikasi pengelola.
              </span>
            </div>
          )}

          <Link to={PATHS.login} className="btn btn--primary btn--block auth-submit">
            Masuk Sekarang
            <ArrowRightIcon size={18} />
          </Link>

          {email && (
            <p className="auth-success__resend">
              Tidak menerima email?{' '}
              <button
                type="button"
                className="auth-text-button"
                onClick={handleResend}
                disabled={resend.state === 'loading'}
              >
                {resend.state === 'loading' ? 'Mengirim…' : 'Kirim ulang'}
              </button>
            </p>
          )}
          {resend.message && (
            <p
              className={resend.state === 'error' ? 'field-error' : 'field-hint'}
              role={resend.state === 'error' ? 'alert' : 'status'}
            >
              {resend.message}
            </p>
          )}
        </section>

        <AuthPageFooter />
      </main>
    </div>
  );
}
