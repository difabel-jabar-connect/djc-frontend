import { useState } from 'react';
import { AlertIcon, CheckCircleIcon, EyeIcon, EyeOffIcon } from '@/components/ui/icons';

/** Kepala panel: judul, keterangan, dan aksi opsional di kanan. */
export function PanelHead({ id, title, description, action }) {
  return (
    <div className="profile-panel__head">
      <div>
        <h2 id={id} className="profile-panel__title">
          {title}
        </h2>
        {description && <p className="profile-panel__desc">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Hasil simpan di samping tombol: `{ state: 'done' | 'error', message }`. Selalu dirender
 * (live region kosong) supaya pembaca layar membacakan perubahan.
 */
export function FormStatus({ status, id }) {
  const error = status.state === 'error';
  return (
    <p
      id={id}
      className={`profile-status${error ? ' profile-status--error' : ''}`}
      role={error ? 'alert' : 'status'}
    >
      {status.state === 'done' && <CheckCircleIcon size={18} />}
      {error && <AlertIcon size={18} />}
      {status.message}
    </p>
  );
}

/**
 * Field form akun: label (+ tanda wajib), kotak input, bantuan, dan error. `children` adalah
 * render prop yang menerima `{ describedBy, invalid }` untuk diteruskan ke kontrolnya.
 */
export function Field({ id, label, required = false, error, hint, prefix, action, children }) {
  const describedBy =
    [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && (
          <>
            {' '}
            <span className="field-required" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden">(wajib)</span>
          </>
        )}
      </label>
      <div className={`input-shell${error ? ' input-shell--invalid' : ''}`}>
        {prefix && (
          <span className="input-shell__prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        {children({ describedBy, invalid: Boolean(error) })}
        {action}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Input kata sandi dengan tombol tampilkan/sembunyikan. */
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  toggleLabel,
  help,
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="profile-password-field">
      <Field
        id={id}
        label={label}
        required
        error={error}
        hint={hint}
        action={
          <button
            type="button"
            className="profile-toggle"
            aria-label={toggleLabel}
            aria-pressed={shown}
            aria-controls={id}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
          </button>
        }
      >
        {({ describedBy, invalid }) => (
          <input
            id={id}
            type={shown ? 'text' : 'password'}
            autoComplete={autoComplete}
            className="input-shell__control"
            value={value}
            onChange={onChange}
            maxLength={72}
            aria-invalid={invalid}
            aria-describedby={describedBy}
          />
        )}
      </Field>
      {help}
    </div>
  );
}
