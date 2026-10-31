import { useId, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { AlertIcon, HistoryIcon, SendIcon, SpinnerIcon, XIcon } from '@/components/ui/icons';
import { REASON_MAX, REASON_MIN } from '@/features/admin/adminFormat';
import { REVISION_SECTIONS } from '@/features/pengelola/pengelolaData';
import { SubjectCard } from '../admin/AdminDialogs';
import { FieldError, Required } from '../admin/FormFields';

function RevisionForm({ ids, subject, defaultSections, onClose, onConfirm, busy, setBusy }) {
  const [sections, setSections] = useState(defaultSections);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const noteLength = note.trim().length;
  const errors = {
    sections: submitted && !sections.length ? 'Pilih minimal satu bagian.' : '',
    note: submitted && noteLength < REASON_MIN ? `Catatan minimal ${REASON_MIN} karakter.` : '',
  };

  const toggle = (section) =>
    setSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    );

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (!sections.length) {
      document.getElementById(`${ids.title}-first`)?.focus();
      return;
    }
    if (noteLength < REASON_MIN) {
      document.getElementById(ids.note)?.focus();
      return;
    }
    setBusy(true);
    try {
      await onConfirm(
        REVISION_SECTIONS.filter((s) => sections.includes(s)),
        note.trim(),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="dialog__form ad-reason" noValidate onSubmit={submit}>
      <div className="dialog__head">
        <span className="dialog__icon dialog__icon--sm pg-dialog-icon--orange" aria-hidden="true">
          <AlertIcon size={24} strokeWidth={2.25} />
        </span>
        <div className="dialog__head-text">
          <h2 id={ids.title} className="dialog__title ad-dialog-title">
            Minta perbaikan data?
          </h2>
          <p id={ids.desc} className="dialog__desc">
            Alumni menerima pemberitahuan berisi bagian yang perlu diperbaiki. Profil tidak tampil
            di pencarian sampai data diperbarui.
          </p>
        </div>
        <button
          type="button"
          className="dialog__close"
          aria-label="Tutup dialog"
          onClick={onClose}
          disabled={busy}
        >
          <XIcon size={20} strokeWidth={2} />
        </button>
      </div>

      <SubjectCard subject={subject} />

      <fieldset
        className="ad-fieldset"
        aria-describedby={errors.sections ? `${ids.title}-sections-error` : undefined}
      >
        <legend className="form-label">
          Bagian yang perlu diperbaiki
          <Required />
        </legend>
        <div className="pg-check-grid">
          {REVISION_SECTIONS.map((section, index) => (
            <label key={section} className="pg-check">
              <input
                id={index === 0 ? `${ids.title}-first` : undefined}
                type="checkbox"
                checked={sections.includes(section)}
                onChange={() => toggle(section)}
                disabled={busy}
              />
              {section}
            </label>
          ))}
        </div>
        <FieldError id={`${ids.title}-sections-error`}>{errors.sections}</FieldError>
      </fieldset>

      <div className="form-field">
        <label htmlFor={ids.note} className="form-label">
          Catatan untuk alumni
          <Required />
        </label>
        <textarea
          id={ids.note}
          className="form-textarea ad-textarea"
          maxLength={REASON_MAX}
          placeholder="Contoh: titik lokasi belum ditentukan di peta."
          value={note}
          disabled={busy}
          onChange={(event) => setNote(event.target.value)}
          aria-invalid={Boolean(errors.note)}
          aria-describedby={[errors.note && `${ids.note}-error`, `${ids.note}-hint`]
            .filter(Boolean)
            .join(' ')}
        />
        <FieldError id={`${ids.note}-error`}>{errors.note}</FieldError>
        <div className="ad-hint-row">
          <span id={`${ids.note}-hint`} className="ad-hint">
            <HistoryIcon size={16} />
            Minimal {REASON_MIN} karakter. Tercatat di Audit Log.
          </span>
          <span className="form-counter">
            {note.length}/{REASON_MAX}
          </span>
        </div>
      </div>

      <div className="dialog__actions">
        <button
          type="button"
          className="btn btn--outline btn--md"
          onClick={onClose}
          disabled={busy}
        >
          Batal
        </button>
        <button
          type="submit"
          className="btn btn--primary btn--md"
          disabled={busy}
          aria-busy={busy || undefined}
        >
          {busy ? <SpinnerIcon className="ad-spin" size={18} /> : <SendIcon size={18} />}
          {busy ? 'Memproses...' : 'Kirim Permintaan'}
        </button>
      </div>
    </form>
  );
}

/**
 * Dialog "Minta Perbaikan": pilih bagian profil + catatan wajib (≥ 10 karakter).
 * `onConfirm(sections, note)` boleh async; dialog ditutup oleh pemanggil.
 */
export default function RevisionDialog({
  open,
  onClose,
  subject,
  defaultSections = [],
  onConfirm,
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const ids = { title: `${id}-title`, desc: `${id}-desc`, note: `${id}-note` };
  const close = () => {
    if (!busy) onClose();
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      labelledBy={ids.title}
      describedBy={ids.desc}
      className="dialog--xs"
    >
      {subject && (
        <RevisionForm
          key={subject.name}
          ids={ids}
          subject={subject}
          defaultSections={defaultSections}
          onClose={close}
          onConfirm={onConfirm}
          busy={busy}
          setBusy={setBusy}
        />
      )}
    </Dialog>
  );
}
