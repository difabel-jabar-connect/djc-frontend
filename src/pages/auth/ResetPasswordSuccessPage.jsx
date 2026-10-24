import { Link } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS } from '@/routes/paths';
import { ArrowRightIcon } from '@/components/ui/icons';
import PasswordResetLayout from './PasswordResetLayout';

function ShieldCheckArt() {
  return (
    <svg width="168" height="140" viewBox="0 0 168 140" aria-hidden="true" focusable="false">
      <circle cx="84" cy="72" r="60" fill="#e8f3fa" />
      <path
        d="M84 16 C100 28 118 32 132 32 V70 C132 100 110 118 84 128 C58 118 36 100 36 70 V32 C50 32 68 28 84 16 Z"
        fill="#fff"
        stroke="#0b3c6e"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path d="M84 30 C96 38 108 42 120 42 V70 C120 92 104 106 84 114 Z" fill="#e3f6f6" />
      <circle cx="84" cy="72" r="24" fill="#16a34a" />
      <path
        d="m73 72.5 8 8 15-16"
        fill="none"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M146 26 L148.5 33 L156 35.5 L148.5 38 L146 45 L143.5 38 L136 35.5 L143.5 33 Z"
        fill="#14a3a3"
      />
      <path
        d="M22 96 L23.5 100.5 L28 102 L23.5 103.5 L22 108 L20.5 103.5 L16 102 L20.5 100.5 Z"
        fill="#0b3c6e"
      />
    </svg>
  );
}

/** Lupa Kata Sandi · 4 — kata sandi berhasil diubah. */
export default function ResetPasswordSuccessPage() {
  useDocumentTitle('Kata Sandi Berhasil Diubah');

  return (
    <PasswordResetLayout>
      <section className="auth-card auth-success" aria-labelledby="sukses-title">
        <ShieldCheckArt />
        <div className="auth-success__text auth-success__text--compact auth-success__text--brand">
          <h1 id="sukses-title">Kata Sandi Berhasil Diubah!</h1>
          <p>Silakan masuk kembali menggunakan kata sandi baru Anda.</p>
        </div>
        <Link to={PATHS.login} className="btn btn--primary btn--block auth-submit">
          Masuk Sekarang
          <ArrowRightIcon size={18} />
        </Link>
      </section>
    </PasswordResetLayout>
  );
}
