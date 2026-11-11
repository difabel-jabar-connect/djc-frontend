import { useEffect, useRef, useState } from 'react';
import { PHONE_PATTERN, normalizePhone, toApiPhone } from '@/features/auth/phone';
import { AuthField } from './AuthFields';

/**
 * Langkah kedua "Masuk dengan Google" untuk akun yang belum terdaftar: Google tidak memberi
 * nomor HP, jadi hanya itu yang diminta. Setelah dikirim, akun customer dibuat dan langsung
 * masuk (POST /auth/google/complete). `google` = hasil useGoogleAuth dengan `signup` terisi.
 */
export default function GoogleSignupForm({ google }) {
  const { signup, loading, status, message } = google;
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!phone) {
      setError('Nomor HP wajib diisi.');
      return;
    }
    if (!PHONE_PATTERN.test(normalizePhone(phone))) {
      setError('Nomor HP belum benar, contoh: 81234567890.');
      return;
    }
    setError('');
    google.completeSignup(toApiPhone(phone));
  };

  return (
    <form
      className="auth-card"
      aria-labelledby="google-signup-title"
      noValidate
      onSubmit={handleSubmit}
    >
      <div className="auth-card__head">
        <h2 id="google-signup-title" ref={headingRef} tabIndex={-1}>
          Lengkapi Pendaftaran
        </h2>
        <p>
          Akun Google <strong>{signup.email}</strong> belum terdaftar. Masukkan nomor HP untuk
          membuat akun Pengguna atas nama <strong>{signup.name}</strong>, lalu Anda langsung masuk.
        </p>
      </div>

      {status === 'error' && message && (
        <p className="auth-alert" role="alert">
          {message}
        </p>
      )}

      <AuthField
        id="google-wa"
        label="Nomor HP"
        error={error}
        prefix={
          <span className="auth-input__prefix" aria-hidden="true">
            +62
          </span>
        }
      >
        {({ describedBy, invalid }) => (
          <input
            id="google-wa"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required
            placeholder="81234567890"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (error) setError('');
            }}
            aria-invalid={invalid}
            aria-describedby={describedBy ? `${describedBy} google-wa-prefix` : 'google-wa-prefix'}
          />
        )}
      </AuthField>
      <span id="google-wa-prefix" className="visually-hidden">
        Kode negara +62 sudah ditambahkan otomatis.
      </span>

      <button
        type="submit"
        className="btn btn--primary btn--block auth-submit"
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? 'Memproses…' : 'Daftar dan Masuk'}
      </button>
      <button
        type="button"
        className="btn btn--outline btn--block"
        onClick={google.cancelSignup}
        disabled={loading}
      >
        Batal
      </button>
    </form>
  );
}
