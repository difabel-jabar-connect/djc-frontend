import { PATHS } from '@/routes/paths';
import { KeyIcon, MailIcon } from '@/components/ui/icons';
import AuthIntro, { AuthPageFooter } from './AuthIntro';
import './auth.css';

const HIGHLIGHTS = [
  { text: 'Tautan aman dikirim ke email Anda', icon: MailIcon },
  { text: 'Kata sandi baru langsung aktif', icon: KeyIcon },
];

/** Kerangka 4 layar alur Lupa Kata Sandi: panel kiri yang sama + kartu di kanan. */
export default function PasswordResetLayout({ children }) {
  return (
    <div className="auth-page">
      <AuthIntro
        titleAs="p"
        title="Saatnya Buat Kata Sandi Baru!"
        text="Tenang, akun Anda tetap aman. Ikuti langkah singkat ini untuk kembali mengakses layanan Difabel Jabar Connect."
        highlights={HIGHLIGHTS}
      />
      <main id="main-content" tabIndex={-1} className="auth-main">
        {children}
        <AuthPageFooter backTo={PATHS.login} backLabel="Kembali ke Masuk" />
      </main>
    </div>
  );
}
