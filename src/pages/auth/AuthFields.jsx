import { useState } from 'react';
import {
  CheckIcon,
  DashedCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MinusLineIcon,
} from '@/components/ui/icons';

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

function RequirementCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="10" fill="#15803d" />
      <path
        d="m7.5 12.5 3 3 6-6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Meter kekuatan + daftar syarat (ikon + teks, tidak hanya warna). */
export function PasswordRequirements({ check }) {
  return (
    <div className="pw-check">
      <div className="strength" aria-live="polite">
        <div className={`strength__bars strength__bars--${check.tone}`} aria-hidden="true">
          {[1, 2, 3].map((level) => (
            <span key={level} className={level <= check.score ? 'is-on' : undefined} />
          ))}
        </div>
        <span className={`strength__text strength__text--${check.tone}`}>
          Kekuatan:{' '}
          {check.tone === 'strong' ? (
            <CheckIcon size={16} strokeWidth={2.75} />
          ) : (
            check.score > 0 && <MinusLineIcon size={16} strokeWidth={2.75} />
          )}
          <strong>{check.label}</strong>
        </span>
      </div>
      <ul className="pw-check__list" aria-label="Syarat kata sandi">
        {check.items.map((item) => (
          <li key={item.key} className={item.met ? 'is-met' : undefined}>
            {item.met ? <RequirementCheck /> : <DashedCircleIcon size={18} />}
            <span>{item.label}</span>
            <span className="pw-check__state">{item.met ? 'Terpenuhi' : 'Belum'}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
