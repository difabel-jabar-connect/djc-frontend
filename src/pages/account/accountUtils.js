import { useCallback } from 'react';
import { useAuth } from '@/context/useAuth';
import { normalizePhone } from '@/features/auth/phone';

/** "+6281234567890" → "+62 812-3456-7890" (tampilan saja). */
export function displayPhone(phone) {
  const digits = normalizePhone(String(phone ?? ''));
  if (!digits) return '';
  const groups = [digits.slice(0, 3), digits.slice(3, 7), digits.slice(7)].filter(Boolean);
  return `+62 ${groups.join('-')}`;
}

/** Perbarui profil sesi (header, langkah pesan) dengan `user` terbaru dari backend. */
export function useSessionUpdate() {
  const { user, signIn } = useAuth();
  return useCallback((next) => next && signIn({ ...user, ...next }), [user, signIn]);
}

/** Pesan error per field dari respons 400 VALIDATION_ERROR backend. */
export const fieldErrorsFrom = (error) =>
  Object.fromEntries((error?.details ?? []).map((d) => [d.field, d.message]));

/** Status form awal (belum ada hasil simpan). */
export const IDLE = { state: 'idle', message: '' };
