import { useState } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon } from '@/components/ui/icons';

/**
 * Field form auth: label (+ tanda wajib), kotak berikon, pesan error, dan bantuan.
 * `children` = kontrol input/select; `describedBy` diteruskan ke kontrol lewat render prop.
 */
export function AuthField({
  id,
  label,
  required = true,
  icon: Icon,
  error,
  prefix,
  help,
  children,
  action,
}) {
  const describedBy =
    [error && `${id}-error`, help && `${id}-help`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
        {required && (
          <>
            {' '}
            <span className="auth-required" aria-hidden="true">
              *
            </span>
          </>
        )}
      </label>
      <div
        className={[
          'auth-input',
          action && 'auth-input--action',
          prefix && 'auth-input--prefixed',
          error && 'auth-input--invalid',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {prefix}
        {Icon && <Icon className="auth-input__icon" />}
        {children({ describedBy, invalid: Boolean(error) })}
        {action}
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
      {help && <div id={`${id}-help`}>{help}</div>}
    </div>
  );
}

/** Field kata sandi dengan tombol tampilkan/sembunyikan. */
export function PasswordField({
  id,
  label,
  toggleLabel,
  value,
  onChange,
  error,
  help,
  placeholder,
}) {
  const [shown, setShown] = useState(false);
  return (
    <AuthField
      id={id}
      label={label}
      icon={LockIcon}
      error={error}
      help={help}
      action={
        <button
          type="button"
          className="auth-input__toggle"
          aria-label={toggleLabel}
          aria-pressed={shown}
          aria-controls={id}
          onClick={() => setShown((value) => !value)}
        >
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    >
      {({ describedBy, invalid }) => (
        <input
          id={id}
          type={shown ? 'text' : 'password'}
          autoComplete="new-password"
          required
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          aria-invalid={invalid}
          aria-describedby={describedBy}
        />
      )}
    </AuthField>
  );
}
