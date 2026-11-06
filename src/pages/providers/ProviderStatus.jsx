import { Link } from 'react-router';
import { PATHS } from '@/routes/paths';

/**
 * Keadaan halaman berbasis profil penyedia selain "berhasil": memuat, tidak ditemukan,
 * atau gagal terhubung (dengan tombol Coba Lagi).
 */
export default function ProviderStatus({ status, onRetry, notFoundLead }) {
  if (status === 'loading') {
    return (
      <section className="container page" aria-labelledby="page-title" aria-busy="true">
        <h1 id="page-title">Memuat profil penyedia…</h1>
        <p className="lead" role="status">
          Mohon tunggu sebentar.
        </p>
      </section>
    );
  }

  if (status === 'notfound') {
    return (
      <section className="container page" aria-labelledby="page-title">
        <h1 id="page-title">Penyedia tidak ditemukan</h1>
        <p className="lead">{notFoundLead}</p>
        <Link to={PATHS.services} className="btn btn--primary">
          Kembali ke Cari Layanan
        </Link>
      </section>
    );
  }

  return (
    <section className="container page" aria-labelledby="page-title">
      <h1 id="page-title">Profil penyedia belum bisa dimuat</h1>
      <p className="lead" role="alert">
        Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.
      </p>
      <div className="page__actions">
        <button type="button" className="btn btn--primary" onClick={onRetry}>
          Coba Lagi
        </button>
        <Link to={PATHS.services} className="btn btn--outline">
          Kembali ke Cari Layanan
        </Link>
      </div>
    </section>
  );
}
