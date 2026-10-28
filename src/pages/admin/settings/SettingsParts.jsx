import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { AlertIcon, CheckIcon, SpinnerIcon } from '@/components/ui/icons';
import { ConfirmDialog } from '../AdminDialogs';

/** Kartu bagian pengaturan: judul h2 + deskripsi. */
export function SettingsCard({ id, title, description, children }) {
  return (
    <section className="dash-card st-card" aria-labelledby={id}>
      <div className="st-card__head">
        <h2 id={id} className="st-card__title">
          {title}
        </h2>
        {description && <p className="st-card__desc">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * Bilah simpan menempel di bawah (desain "Ada perubahan yang belum disimpan").
 * Selama ada perubahan, pindah halaman dalam aplikasi meminta konfirmasi dan
 * menutup/memuat ulang tab memunculkan peringatan browser.
 */
export function SaveBar({ dirty, saving, onReset, onSave }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  return (
    <>
      <div className="st-savebar" role="region" aria-label="Simpan perubahan">
        <p role="status" className={`st-savebar__status${dirty ? ' is-dirty' : ''}`}>
          <span className="st-savebar__dot" aria-hidden="true" />
          {dirty ? 'Ada perubahan yang belum disimpan' : 'Semua perubahan sudah tersimpan'}
        </p>
        <div className="st-savebar__actions">
          <button
            type="button"
            className="btn btn--outline btn--md"
            onClick={onReset}
            disabled={!dirty || saving}
          >
            Batalkan
          </button>
          <button
            type="button"
            className="btn btn--primary btn--md"
            onClick={onSave}
            disabled={!dirty || saving}
            aria-busy={saving || undefined}
          >
            {saving ? (
              <SpinnerIcon className="ad-spin" size={18} />
            ) : (
              <CheckIcon size={18} strokeWidth={2.5} />
            )}
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        tone="warning"
        icon={AlertIcon}
        title="Tinggalkan halaman ini?"
        description="Perubahan yang belum disimpan akan hilang."
        cancelLabel="Tetap di Sini"
        confirmLabel="Tinggalkan"
        onConfirm={() => blocker.proceed?.()}
      />
    </>
  );
}
