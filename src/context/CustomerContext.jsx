import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useAuth } from '@/context/useAuth';
import { SAMPLE_BOOKINGS, findBooking, nextBookingCode } from '@/features/booking/customerBookings';
import { fromApiBooking, isBackendBooking } from '@/features/booking/bookingAdapters';
import {
  cancelBooking as cancelBookingRequest,
  getBookingDetail,
  listCustomerBookings,
} from '@/features/booking/bookingApi';
import { submitReview } from '@/features/reviews/reviewsApi';
import { isBackendId } from '@/features/chat/chatSync';
import { CustomerContext } from './useCustomer';

const FAVORITES_KEY = 'djc.favorites';

const nowStamp = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function mergeBooking(existing, incoming) {
  if (!existing) return incoming;
  return {
    ...existing,
    ...incoming,
    // Pertahankan snapshot penyedia lokal (rating/kategori) bila respons daftar belum memilikinya.
    provider: {
      ...existing.provider,
      ...incoming.provider,
      rating: incoming.provider?.rating || existing.provider?.rating || 0,
      reviewCount: incoming.provider?.reviewCount || existing.provider?.reviewCount || 0,
      category:
        incoming.provider?.category && incoming.provider.category !== 'Layanan'
          ? incoming.provider.category
          : existing.provider?.category || incoming.provider?.category || 'Layanan',
    },
    // Pertahankan riwayat lengkap jika item sebelumnya sudah memuat detail.
    history:
      incoming.hasFullHistory || !existing.hasFullHistory ? incoming.history : existing.history,
    hasFullHistory: Boolean(incoming.hasFullHistory || existing.hasFullHistory),
  };
}

function bookingsReducer(bookings, action) {
  switch (action.type) {
    case 'replace':
      return action.bookings;
    case 'upsert': {
      const index = bookings.findIndex(
        (b) =>
          (action.booking.id && b.id === action.booking.id) ||
          b.code.toLowerCase() === String(action.booking.code).toLowerCase(),
      );
      if (index === -1) return [action.booking, ...bookings];
      return bookings.map((b, i) => (i === index ? mergeBooking(b, action.booking) : b));
    }
    case 'create':
      return [
        {
          ...action.booking,
          // Kode dari backend (POST /bookings) bila ada; selain itu kode lokal berikutnya.
          code: action.booking.code ?? nextBookingCode(bookings),
          status: 'menunggu',
          unread: false,
          history: [{ status: 'menunggu', by: 'Anda', at: nowStamp() }],
        },
        ...bookings,
      ];
    case 'cancel':
      return bookings.map((b) =>
        b.code === action.code
          ? {
              ...b,
              status: 'dibatalkan',
              contact: null,
              cancelReason: action.reason,
              history: [...b.history, { status: 'dibatalkan', by: 'Anda', at: nowStamp() }],
            }
          : b,
      );
    case 'read':
      return bookings.map((b) => (b.code === action.code ? { ...b, unread: false } : b));
    case 'review':
      return bookings.map((b) =>
        b.code === action.code
          ? { ...b, reviewed: true, canReview: false, review: action.review }
          : b,
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
 * - Untuk akun pelanggan backend (id UUID, FE-04 & FE-05a): otomatis memuat dari
 *   GET /bookings, GET /bookings/:id, PUT /bookings/:id/cancel, dan POST /bookings/:id/reviews.
 * - Untuk akun demo lokal (`u-budi`) atau `initialBookings` pada unit test: memakai data lokal.
 */
export function CustomerProvider({ children, initialBookings }) {
  const { user } = useAuth();
  const useBackend =
    initialBookings === undefined && user?.role === 'customer' && isBackendId(user?.id);

  const [bookings, dispatch] = useReducer(
    bookingsReducer,
    initialBookings !== undefined ? initialBookings : useBackend ? [] : SAMPLE_BOOKINGS,
  );
  const [bookingsStatus, setBookingsStatus] = useState(() => (useBackend ? 'loading' : 'ready'));
  const [bookingsError, setBookingsError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [favorites, setFavorites] = useState(readFavorites);
  const bookingsRef = useRef(bookings);
  bookingsRef.current = bookings;

  useEffect(() => {
    if (initialBookings !== undefined) return undefined;
    if (!useBackend) {
      dispatch({ type: 'replace', bookings: SAMPLE_BOOKINGS });
      setBookingsStatus('ready');
      setBookingsError(null);
      return undefined;
    }

    const controller = new AbortController();
    let ignore = false;
    setBookingsStatus('loading');
    setBookingsError(null);

    listCustomerBookings({ signal: controller.signal })
      .then((rows) => {
        if (ignore) return;
        dispatch({ type: 'replace', bookings: rows.map((row) => fromApiBooking(row)) });
        setBookingsStatus('ready');
      })
      .catch((error) => {
        if (ignore || error?.name === 'AbortError') return;
        setBookingsError(error?.message || 'Daftar pesanan belum bisa dimuat.');
        setBookingsStatus('error');
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [useBackend, user?.id, initialBookings, refreshTick]);

  const refreshBookings = useCallback(() => {
    if (useBackend) setRefreshTick((n) => n + 1);
  }, [useBackend]);

  const loadBookingDetail = useCallback(
    async (codeOrId, { signal } = {}) => {
      if (!useBackend) return null;
      const existing =
        findBooking(bookingsRef.current, codeOrId) ??
        bookingsRef.current.find((b) => b.id === codeOrId);
      const targetId = isBackendBooking(existing)
        ? existing.id
        : isBackendId(codeOrId)
          ? codeOrId
          : null;
      if (!targetId) return existing ?? null;
      const raw = await getBookingDetail(targetId, { signal });
      if (!raw) return existing ?? null;
      const mapped = fromApiBooking(raw);
      dispatch({ type: 'upsert', booking: mapped });
      return mapped;
    },
    [useBackend],
  );

  const cancelBooking = useCallback(async (code, reason) => {
    const existing = findBooking(bookingsRef.current, code);
    if (isBackendBooking(existing)) {
      const updated = await cancelBookingRequest(existing.id, reason);
      dispatch({ type: 'upsert', booking: fromApiBooking(updated) });
      return;
    }
    dispatch({ type: 'cancel', code, reason });
  }, []);

  const reviewBooking = useCallback(async (code, review) => {
    const existing = findBooking(bookingsRef.current, code);
    if (isBackendBooking(existing)) {
      await submitReview(existing.id, { rating: review.rating, comment: review.text });
    }
    dispatch({ type: 'review', code, review });
  }, []);

  const markRead = useCallback((code) => dispatch({ type: 'read', code }), []);
  // Kode dihitung di sini juga agar halaman sukses langsung tahu kode pesanan baru.
  const createBooking = useCallback(
    (booking) => {
      const code = booking.code ?? nextBookingCode(bookings);
      dispatch({ type: 'create', booking });
      return code;
    },
    [bookings],
  );

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
    () => ({
      bookings,
      bookingsStatus,
      bookingsError,
      refreshBookings,
      loadBookingDetail,
      createBooking,
      cancelBooking,
      reviewBooking,
      markRead,
      favorites,
      toggleFavorite,
    }),
    [
      bookings,
      bookingsStatus,
      bookingsError,
      refreshBookings,
      loadBookingDetail,
      createBooking,
      cancelBooking,
      reviewBooking,
      markRead,
      favorites,
      toggleFavorite,
    ],
  );
  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}
