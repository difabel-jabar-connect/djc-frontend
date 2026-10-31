import { GoogleMarkIcon, SpinnerIcon } from '@/components/ui/icons';

/**
 * Tombol "Masuk/Daftar dengan Google" + pesan hasilnya.
 * `google` = hasil useGoogleAuth; `action` = tautan tambahan setelah pesan (mis. "Daftar sekarang").
 */
export default function GoogleAuthButton({ label, google, onClick, action }) {
  const { loading, status, message } = google;

  return (
    <>
      <button
        type="button"
        className="auth-google"
        onClick={onClick}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <SpinnerIcon className="spin" /> : <GoogleMarkIcon />}
        {loading ? 'Menghubungkan ke Google…' : label}
      </button>
      {message && status === 'error' && (
        <p className="auth-alert auth-google__message" role="alert">
          {message}
          {action && <> {action}</>}
        </p>
      )}
      {message && status === 'info' && (
        <p className="field-hint auth-info" role="status">
          {message}
        </p>
      )}
    </>
  );
}
