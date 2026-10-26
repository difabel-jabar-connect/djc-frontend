import { useEffect, useState } from 'react';
import { isDev } from '@/config/env';
import { authenticateWithGoogle } from './authApi';
import { getGoogleClientId, loadGoogleScript, requestGoogleAuthCode } from './google';

const NOT_CONFIGURED = isDev
  ? 'Masuk dengan Google belum dikonfigurasi. Isi VITE_GOOGLE_CLIENT_ID di .env.local lalu jalankan ulang dev server.'
  : 'Masuk dengan Google sedang tidak tersedia. Silakan gunakan email dan kata sandi.';

/**
 * Alur tombol Google: popup akun → code → POST /auth/google → `onSuccess(data)`.
 * `status`: 'idle' | 'loading' | 'info' (dibatalkan/info) | 'error'; `errorCode` untuk
 * pesan khusus di halaman (mis. 404 = belum terdaftar, 409 = sudah terdaftar).
 * `errorMessages`: pesan pengganti per status HTTP dari backend.
 */
export function useGoogleAuth({ intent, onSuccess, errorMessages = {} }) {
  const [state, setState] = useState({ status: 'idle', message: '', errorCode: null });

  // Muat skrip GIS lebih awal agar popup terbuka langsung saat tombol diklik
  // (popup yang tertunda bisa diblokir browser).
  useEffect(() => {
    if (getGoogleClientId()) loadGoogleScript().catch(() => {});
  }, []);

  const start = async (extra = {}) => {
    setState({ status: 'loading', message: '', errorCode: null });
    let code;
    try {
      code = await requestGoogleAuthCode();
    } catch (error) {
      const cancelled = error?.code === 'popup_closed';
      setState({
        status: cancelled ? 'info' : 'error',
        message: error?.code === 'not_configured' ? NOT_CONFIGURED : error?.message,
        errorCode: error?.code ?? null,
      });
      return;
    }

    try {
      const data = await authenticateWithGoogle({ code, intent, ...extra });
      setState({ status: 'idle', message: '', errorCode: null });
      onSuccess(data);
    } catch (error) {
      setState({
        status: 'error',
        message:
          errorMessages[error?.status] ||
          error?.message ||
          'Gagal masuk dengan Google. Silakan coba lagi.',
        errorCode: error?.status ?? error?.code ?? null,
      });
    }
  };

  return { ...state, loading: state.status === 'loading', start };
}
