import { io } from 'socket.io-client';
import { getApiBaseUrl } from '@/config/env';

let socket = null;

/**
 * Mendapatkan origin base URL server backend untuk koneksi Socket.io.
 * Mengubah path seperti 'http://localhost:5000/api/v1' menjadi 'http://localhost:5000'.
 */
function getSocketServerUrl() {
  const apiUrl = getApiBaseUrl();
  try {
    const parsed = new URL(apiUrl);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return 'http://localhost:5000';
  }
}

/**
 * Menginisialisasi koneksi singleton Socket.io client dengan cookie kredensial.
 *
 * @returns {import('socket.io-client').Socket}
 */
export function getSocket() {
  if (!socket) {
    const serverUrl = getSocketServerUrl();
    socket = io(serverUrl, {
      path: '/socket.io',
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/**
 * Menyambungkan socket jika belum terhubung.
 */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

/**
 * Memutuskan koneksi socket saat logout.
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
