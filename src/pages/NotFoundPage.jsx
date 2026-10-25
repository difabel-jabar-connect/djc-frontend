import { Link } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PATHS } from '@/routes/paths';

export default function NotFoundPage() {
  useDocumentTitle('Halaman tidak ditemukan');

  return (
    <section className="container page" aria-labelledby="page-title">
      <h1 id="page-title">Halaman tidak ditemukan</h1>
      <p className="lead">Alamat yang Anda buka tidak tersedia atau sudah dipindahkan.</p>
      <Link to={PATHS.home} className="button">
        Kembali ke beranda
      </Link>
    </section>
  );
}
