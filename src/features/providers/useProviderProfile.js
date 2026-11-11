import { useCallback, useEffect, useState } from 'react';
import { getProviderProfile } from '@/features/search/servicesApi';
import { toProfile } from './providerAdapters';

/**
 * Profil publik penyedia dari backend (GET /providers/:id), sudah diubah ke model profil UI.
 * status: 'loading' | 'success' | 'notfound' | 'error'. `retry()` meminta ulang.
 */
export function useProviderProfile(id) {
  const [state, setState] = useState({ id: null, status: 'loading', profile: null, error: null });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ id, status: 'loading', profile: null, error: null });
    getProviderProfile(id, { signal: controller.signal }).then(
      (data) => setState({ id, status: 'success', profile: toProfile(data), error: null }),
      (error) => {
        if (error?.name === 'AbortError') return;
        const notFound = error?.status === 404 || error?.status === 400;
        setState({ id, status: notFound ? 'notfound' : 'error', profile: null, error });
      },
    );
    return () => controller.abort();
  }, [id, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const fresh = state.id === id;
  return {
    status: fresh ? state.status : 'loading',
    profile: fresh ? state.profile : null,
    error: fresh ? state.error : null,
    retry,
  };
}
