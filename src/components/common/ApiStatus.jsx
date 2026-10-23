import { useCallback, useEffect, useState } from 'react';
import { getHealth } from '@/lib/api/health';

/**
 * Panel cek koneksi ke backend (GET /health).
 * Sekaligus contoh pola state Loading / Success / Error yang diumumkan screen reader.
 */
export default function ApiStatus() {
  const [state, setState] = useState({ status: 'loading', message: '' });

  const check = useCallback(async (signal) => {
    setState({ status: 'loading', message: '' });
    try {
      const data = await getHealth({ signal });
      setState({ status: 'ok', message: data?.status ?? 'ok' });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      setState({ status: 'error', message: error.message });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    check(controller.signal);
    return () => controller.abort();
  }, [check]);

  return (
    <section className="card" aria-labelledby="api-status-title">
      <h2 id="api-status-title">Status koneksi API</h2>
      <div aria-live="polite" aria-busy={state.status === 'loading'}>
        {state.status === 'loading' && <p>Memeriksa koneksi ke server…</p>}
        {state.status === 'ok' && (
          <p className="status status--ok">
            Terhubung ke backend (status: <code>{state.message}</code>).
          </p>
        )}
        {state.status === 'error' && (
          <p className="status status--error" role="alert">
            {state.message}
          </p>
        )}
      </div>
      {state.status === 'error' && (
        <button type="button" className="button" onClick={() => check()}>
          Coba Lagi
        </button>
      )}
    </section>
  );
}
