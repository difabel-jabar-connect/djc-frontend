import { useCallback, useMemo, useReducer, useState } from 'react';
import { SAMPLE_BOOKINGS } from '@/features/booking/customerBookings';
import { CustomerContext } from './useCustomer';

const FAVORITES_KEY = 'djc.favorites';

const nowStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function bookingsReducer(bookings, action) {
  switch (action.type) {
    case 'cancel':
      return bookings.map((b) =>
        b.code === action.code
          ? {
              ...b,
              status: 'dibatalkan',
              cancelReason: action.reason,
              history: [...b.history, { status: 'dibatalkan', by: 'Anda', at: nowStamp() }],
            }
          : b,
      );
    case 'read':
      return bookings.map((b) => (b.code === action.code ? { ...b, unread: false } : b));
    case 'review':
      return bookings.map((b) =>
        b.code === action.code ? { ...b, reviewed: true, review: action.review } : b,
      );
    default:
      return bookings;
  }
}

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}

/**
 * Data milik pelanggan: pesanan & penyedia favorit.
 * Sementara dari data contoh + state lokal; TODO(API): sinkronkan dengan endpoint pesanan
 * (batal, ulasan) dan favorit.
 */
export function CustomerProvider({ children, initialBookings = SAMPLE_BOOKINGS }) {
  const [bookings, dispatch] = useReducer(bookingsReducer, initialBookings);
  const [favorites, setFavorites] = useState(readFavorites);

  const cancelBooking = useCallback(
    (code, reason) => dispatch({ type: 'cancel', code, reason }),
    [],
  );
  const reviewBooking = useCallback(
    (code, review) => dispatch({ type: 'review', code, review }),
    [],
  );
  const markRead = useCallback((code) => dispatch({ type: 'read', code }), []);

  const toggleFavorite = useCallback((providerId) => {
    setFavorites((current) => {
      const next = current.includes(providerId)
        ? current.filter((id) => id !== providerId)
        : [...current, providerId];
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // abaikan
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ bookings, cancelBooking, reviewBooking, markRead, favorites, toggleFavorite }),
    [bookings, cancelBooking, reviewBooking, markRead, favorites, toggleFavorite],
  );
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}
