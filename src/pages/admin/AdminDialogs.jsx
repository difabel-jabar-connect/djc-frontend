import { useId, useRef, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { CheckIcon, HistoryIcon, SpinnerIcon, XIcon } from '@/components/ui/icons';
import { REASON_MAX, isReasonValid, reasonError } from '@/features/admin/adminFormat';
import { Avatar } from './AdminParts';

function CloseButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      className="dialog__close"
      aria-label="Tutup dialog"
      onClick={onClick}
      disabled={disabled}
    >
      <XIcon size={20} strokeWidth={2} />
    </button>
  );
}

/** Kartu ringkas subjek aksi (avatar + nama + keterangan). */
export function SubjectCard({ subject }) {
  return (
    <div className="ad-subject">
      <Avatar person={subject} size={40} />
      <span className="ad-subject__text">
        <strong>{subject.name}</strong>
        {subject.meta && <span>{subject.meta}</span>}
        {subject.extra}
      </span>
    </div>
  );
}

function ConfirmButton({ tone, busy, disabled, icon: Icon, children, type = 'submit', onClick }) {
  return (
    <button
      type={type}
      className={`btn btn--md ${tone === 'success' ? 'btn--success' : tone === 'danger' ? 'btn--danger-solid' : 'btn--primary'}`}
      disabled={busy || disabled}
      aria-busy={busy || undefined}
      onClick={onClick}
    >
      {busy ? (
        <>
          <SpinnerIcon className="ad-spin" size={18} />
          Memproses...
        </>
      ) : (
        <>
          {Icon && <Icon size={18} strokeWidth={2.25} />}
          {children}
        </>
      )}
    </button>
  );
}

function ReasonForm({
  ids,
  tone,
  icon: Icon,
  title,
  description,
  subject,
  summary,
  quickReasons = [],
  required,
  label,
  placeholder,
  confirmLabel,
  onConfirm,
  onClose,
  busy,
  setBusy,
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const fieldRef = useRef(null);
  const error = touched ? reasonError(reason, { required }) : '';
  const valid = isReasonValid(reason, { required });

  const pickQuickReason = (text) => {
    const prefix = `${text}: `;
    setReason((current) =>
      current.startsWith(text)
        ? current.slice(current.startsWith(prefix) ? prefix.length : text.length)
        : prefix + current,
    );
    requestAnimationFrame(() => {
      const field = fieldRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(field.value.length, field.value.length);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onConfirm(reason.trim());
    } finally {
      setBusy(false);
    }
  };

  const describedBy = [error && ids.error, ids.hint, ids.count].filter(Boolean).join(' ');

  return (
    <form className="dialog__form ad-reason" noValidate onSubmit={handleSubmit}>
      <div className="dialog__head">
        <span className={`dialog__icon dialog__icon--sm dialog__icon--${tone}`} aria-hidden="true">
          <Icon size={24} strokeWidth={2.25} />
        </span>
        <div className="dialog__head-text">
          <h2 id={ids.title} className="dialog__title ad-dialog-title">
            {title}
          </h2>
          <p id={ids.desc} className="dialog__desc">
            {description}
          </p>
        </div>
        <CloseButton onClick={onClose} disabled={busy} />
      </div>

      {subject && <SubjectCard subject={subject} />}
      {summary}

      {quickReasons.length > 0 && (
        <div role="group" aria-label="Alasan cepat" className="ad-chips">
          {quickReasons.map((text) => {
            const pressed = reason.startsWith(text);
            return (
              <button
                key={text}
                type="button"
                className="ad-chip"
                aria-pressed={pressed}
                disabled={busy}
                onClick={() => pickQuickReason(text)}
              >
                {pressed && <CheckIcon size={14} strokeWidth={2.5} />}
                {text}
              </button>
            );
          })}
        </div>
      )}

      <div className="form-field">
        <label htmlFor={ids.field} className="form-label">
          {label}
          {required ? (
            <>
              <span className="form-required" aria-hidden="true">
                {' '}
                *
              </span>
              <span className="visually-hidden"> (wajib)</span>
            </>
          ) : (
            <span className="form-label__optional"> (opsional)</span>
          )}
        </label>
        <textarea
          ref={fieldRef}
          id={ids.field}
          className="form-textarea ad-textarea"
          required={required}
          maxLength={REASON_MAX}
          placeholder={placeholder}
          value={reason}
          disabled={busy}
          onChange={(event) => setReason(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
        />
        {error && (
          <p id={ids.error} className="form-field__error ad-field-error">
            {error}
          </p>
        )}
        <div className="form-field__foot ad-hint-row">
          <span id={ids.hint} className="ad-hint">
            <HistoryIcon size={16} />
            {required ? 'Minimal 10 karakter. ' : ''}Tercatat di Audit Log.
          </span>
          <span id={ids.count} className="form-counter">
            {reason.length}/{REASON_MAX}
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
        <ConfirmButton tone={tone} busy={busy} disabled={!valid}>
          {confirmLabel}
        </ConfirmButton>
      </div>
    </form>
  );
}

/**
 * Pola "Aksi dengan Alasan": alasan wajib ≥ 10 karakter (kecuali `required={false}`),
 * tombol aksi nonaktif sampai valid, lalu "Memproses..." agar tidak terkirim dua kali.
 * `onConfirm(alasan)` boleh async; dialog ditutup oleh pemanggil.
 */
export function ReasonDialog({ open, onClose, required = true, label = 'Alasan', ...props }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const ids = {
    title: `${id}-title`,
    desc: `${id}-desc`,
    field: `${id}-field`,
    error: `${id}-error`,
    hint: `${id}-hint`,
    count: `${id}-count`,
  };
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
      <ReasonForm
        ids={ids}
        required={required}
        label={label}
        placeholder="Tuliskan alasan yang jelas"
        onClose={close}
        busy={busy}
        setBusy={setBusy}
        {...props}
      />
    </Dialog>
  );
}

/** Konfirmasi tanpa alasan (role="alertdialog"), mis. hapus kategori / buat pengelola. */
export function ConfirmDialog({
  open,
  onClose,
  tone = 'danger',
  icon: Icon,
  title,
  description,
  subject,
  cancelLabel = 'Batal',
  confirmLabel,
  confirmIcon,
  onConfirm,
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const close = () => {
    if (!busy) onClose();
  };
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={close}
      role="alertdialog"
      labelledBy={`${id}-title`}
      describedBy={`${id}-desc`}
      className="dialog--xs"
    >
      <div className="dialog__head">
        <span className={`dialog__icon dialog__icon--sm dialog__icon--${tone}`} aria-hidden="true">
          <Icon size={24} strokeWidth={2.25} />
        </span>
        <div className="dialog__head-text">
          <h2 id={`${id}-title`} className="dialog__title ad-dialog-title">
            {title}
          </h2>
          <p id={`${id}-desc`} className="dialog__desc">
            {description}
          </p>
        </div>
      </div>
      {subject && <SubjectCard subject={subject} />}
      <div className="dialog__actions">
        <button type="button" className="btn btn--outline btn--md" onClick={close} disabled={busy}>
          {cancelLabel}
        </button>
        <ConfirmButton tone={tone} busy={busy} icon={confirmIcon} type="button" onClick={confirm}>
          {confirmLabel}
        </ConfirmButton>
      </div>
    </Dialog>
  );
}
