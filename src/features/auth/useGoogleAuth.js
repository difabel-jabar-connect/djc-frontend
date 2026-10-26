import { useEffect, useRef, useState } from 'react';
import { isDev } from '@/config/env';
import { getHealth } from '@/lib/api/health';
import { authenticateWithGoogle } from './authApi';
import {
  getGoogleClientId,
  loadGoogleScript,
  requestGoogleAuthCode,
  requestGoogleProfile,
} from './google';

const NOT_CONFIGURED = isDev
  ? 'Masuk dengan Google belum dikonfigurasi. Isi VITE_GOOGLE_CLIENT_ID di .env.local lalu jalankan ulang dev server.'
  : 'Masuk dengan Google sedang tidak tersedia. Silakan gunakan email dan kata sandi.';

/** Profil Google → bentuk `data` yang sama dengan respons POST /auth/google. */
const profileToData = (profile, extra) => ({
  user: {
    id: `google-${profile.sub}`,
    name: profile.name || profile.email,
    email: profile.email,
    picture: profile.picture,
    role: extra.role ?? 'customer',
    city: extra.city ?? 'Bandung',
    provider: 'google',
  },
  demo: true,
});

/**
 * Alur tombol Google: popup akun → code → POST /auth/google → `onSuccess(data)`.
 * `status`: 'idle' | 'loading' | 'info' (dibatalkan/info) | 'error'; `errorCode` untuk
 * pesan khusus di halaman (mis. 404 = belum terdaftar, 409 = sudah terdaftar).
 * `errorMessages`: pesan pengganti per status HTTP dari backend.
 *
 * Mode development: bila backend tidak terjangkau, profil diambil langsung dari Google
 * (lihat requestGoogleProfile) agar login Google tetap bisa dicoba tanpa backend.
 */
export function useGoogleAuth({ intent, onSuccess, errorMessages = {} }) {
  const [state, setState] = useState({ status: 'idle', message: '', errorCode: null });
  const backendDown = useRef(false);

  // Muat skrip GIS lebih awal agar popup terbuka langsung saat tombol diklik
  // (popup yang tertunda bisa diblokir browser). Di development, cek juga backend.
  useEffect(() => {
    if (!getGoogleClientId()) return undefined;
    loadGoogleScript().catch(() => {});
    if (!isDev) return undefined;
    const controller = new AbortController();
    getHealth({ signal: controller.signal })
      .then(() => {
        backendDown.current = false;
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') backendDown.current = error?.code === 'ERR_NET_FAIL';
      });
    return () => controller.abort();
  }, []);

  const fail = (error) => {
    const cancelled = error?.code === 'popup_closed';
    setState({
      status: cancelled ? 'info' : 'error',
      message: error?.code === 'not_configured' ? NOT_CONFIGURED : error?.message,
      errorCode: error?.code ?? null,
    });
  };

  const start = async (extra = {}) => {
    setState({ status: 'loading', message: '', errorCode: null });

    if (isDev && backendDown.current) {
      try {
        const profile = await requestGoogleProfile();
        setState({ status: 'idle', message: '', errorCode: null });
        onSuccess(profileToData(profile, extra));
      } catch (error) {
        fail(error);
      }
      return;
    }

    let code;
    try {
      code = await requestGoogleAuthCode();
    } catch (error) {
      fail(error);
      return;
    }

    try {
      const data = await authenticateWithGoogle({ code, intent, ...extra });
      setState({ status: 'idle', message: '', errorCode: null });
      onSuccess(data);
    } catch (error) {
      if (isDev && error?.code === 'ERR_NET_FAIL') {
        // Cek backend di awal belum selesai saat tombol diklik; klik berikutnya pakai mode demo.
        backendDown.current = true;
        setState({
          status: 'info',
          message:
            'Server backend belum berjalan. Klik tombol Google sekali lagi untuk masuk dalam mode demo.',
          errorCode: error.code,
        });
        return;
      }
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
