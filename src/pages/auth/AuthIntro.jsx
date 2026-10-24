import { Link } from 'react-router';
import logo from '@/assets/icons/logo-footer.svg';
import { PATHS } from '@/routes/paths';
import { ArrowLeftIcon } from '@/components/ui/icons';
import AuthBackdrop from './AuthBackdrop';

/**
 * Panel kiri halaman auth (Masuk, Daftar, Pendaftaran Berhasil).
 * `titleAs="p"` dipakai bila judul halaman (h1) berada di kartu sebelah kanan.
 */
export default function AuthIntro({ title, titleAs: Title = 'h1', text, highlights = [] }) {
  return (
    <aside className="auth-intro" aria-label="Tentang Difabel Jabar Connect">
      <AuthBackdrop />
      <div className="auth-intro__content">
        <Link to={PATHS.home} className="auth-brand" aria-label="Difabel Jabar Connect, ke beranda">
          <img src={logo} alt="" width="48" height="48" />
          <span aria-hidden="true">
            <span className="auth-brand__name">Difabel Jabar Connect</span>
            <span className="auth-brand__tagline">
              Talenta Difabel, untuk Jawa Barat yang Lebih Inklusif
            </span>
          </span>
        </Link>
        <div className="auth-intro__text">
          <Title className="auth-intro__title">{title}</Title>
          <p>{text}</p>
        </div>
        {highlights.length > 0 && (
          <ul className="auth-intro__list">
            {highlights.map(({ text: item, icon: Icon }) => (
              <li key={item}>
                <span className="auth-intro__icon" aria-hidden="true">
                  <Icon />
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="auth-intro__motto">Kesempatan yang Setara, Manfaat untuk Semua</p>
    </aside>
  );
}

/** Tautan "Kembali ke Beranda" + hak cipta di bawah kartu auth. */
export function AuthPageFooter() {
  return (
    <div className="auth-main__foot">
      <Link to={PATHS.home} className="auth-back">
        <ArrowLeftIcon size={18} />
        Kembali ke Beranda
      </Link>
      <p>© {new Date().getFullYear()} Difabel Jabar Connect</p>
    </div>
  );
}
