/**
 * Masuk/daftar dengan Google memakai Google Identity Services (GIS), alur
 * *authorization code* lewat popup. Dipilih karena tombol tetap bisa memakai desain
 * sendiri (alur ID token/One Tap mewajibkan tombol bawaan Google).
 *
 * Frontend hanya mengambil `code` sekali pakai; backend menukarnya ke Google
 * (client secret + redirect_uri "postmessage"), memverifikasi id_token, lalu
 * membuat sesi cookie. Client secret TIDAK pernah ada di frontend.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPES = 'openid email profile';

/** OAuth Client ID (publik) dari Google Cloud Console; kosong = fitur nonaktif. */
export const getGoogleClientId = () => String(import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim();

export class GoogleAuthError extends Error {
  /** `code`: 'not_configured' | 'script_failed' | 'popup_closed' | 'popup_blocked' | 'denied' */
  constructor(code, message) {
    super(message);
    this.name = 'GoogleAuthError';
    this.code = code;
  }
}

let scriptPromise = null;

/** Muat skrip GIS sekali saja (dipanggil saat tombol diklik, bukan saat halaman dibuka). */
export function loadGoogleScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () =>
        window.google?.accounts?.oauth2
          ? resolve(window.google)
          : reject(new GoogleAuthError('script_failed', 'Layanan Google tidak tersedia.'));
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(
          new GoogleAuthError(
            'script_failed',
            'Tidak dapat memuat layanan Google. Periksa koneksi internet Anda.',
          ),
        );
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

const POPUP_ERRORS = {
  popup_closed: 'Jendela Google ditutup sebelum proses selesai.',
  popup_failed_to_open: 'Jendela Google diblokir browser. Izinkan pop-up lalu coba lagi.',
};

/**
 * Buka popup akun Google dan kembalikan authorization code.
 * Harus dipanggil langsung dari klik pengguna agar popup tidak diblokir.
 */
export async function requestGoogleAuthCode() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new GoogleAuthError('not_configured', 'Masuk dengan Google belum dikonfigurasi.');
  }
  const google = await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: SCOPES,
      ux_mode: 'popup',
      select_account: true,
      callback: (response) => {
        if (response?.code) resolve(response.code);
        else
          reject(
            new GoogleAuthError(
              'denied',
              response?.error === 'access_denied'
                ? 'Izin akses akun Google tidak diberikan.'
                : 'Gagal masuk dengan Google. Silakan coba lagi.',
            ),
          );
      },
      error_callback: (error) => {
        const type = error?.type === 'popup_failed_to_open' ? 'popup_blocked' : 'popup_closed';
        reject(new GoogleAuthError(type, POPUP_ERRORS[error?.type] ?? POPUP_ERRORS.popup_closed));
      },
    });
    client.requestCode();
  });
}

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

/**
 * KHUSUS DEVELOPMENT (backend belum berjalan): ambil profil Google langsung di browser
 * lewat token client + endpoint userinfo. Tidak aman untuk produksi karena tidak ada
 * verifikasi di server — di produksi selalu pakai requestGoogleAuthCode + backend.
 */
export async function requestGoogleProfile() {
  const clientId = getGoogleClientId();
  if (!clientId) {
    throw new GoogleAuthError('not_configured', 'Masuk dengan Google belum dikonfigurasi.');
  }
  const google = await loadGoogleScript();

  const accessToken = await new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response) => {
        if (response?.access_token) resolve(response.access_token);
        else reject(new GoogleAuthError('denied', 'Izin akses akun Google tidak diberikan.'));
      },
      error_callback: (error) => {
        const type = error?.type === 'popup_failed_to_open' ? 'popup_blocked' : 'popup_closed';
        reject(new GoogleAuthError(type, POPUP_ERRORS[error?.type] ?? POPUP_ERRORS.popup_closed));
      },
    });
    client.requestAccessToken({ prompt: 'select_account' });
  });

  const response = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new GoogleAuthError('denied', 'Gagal membaca profil Google. Silakan coba lagi.');
  }
  return response.json(); // { sub, name, given_name, email, email_verified, picture }
}
