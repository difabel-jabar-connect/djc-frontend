import { AlertCircleIcon, ChevronDownIcon } from '@/components/ui/icons';

/** Penanda wajib: bintang merah (visual) + "(wajib)" untuk pembaca layar. */
export function Required() {
  return (
    <>
      <span className="form-required" aria-hidden="true">
        {' '}
        *
      </span>
      <span className="visually-hidden"> (wajib)</span>
    </>
  );
}

export function Optional() {
  return <span className="form-label__optional"> (opsional)</span>;
}

export function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="ad-field-error">
      <AlertCircleIcon size={16} strokeWidth={2.25} />
      {children}
    </p>
  );
}

const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

/**
 * Input berikon (desain Admin). `prefix` = teks di depan nilai (mis. "+62"),
 * `trailing` = elemen di ujung kanan (mis. tombol lihat sandi), `required={false}`
 * menampilkan "(opsional)" kecuali `hideOptional`.
 */
export function TextField({
  id,
  label,
  icon: Icon,
  prefix,
  trailing,
  help,
  error,
  required = true,
  hideOptional = false,
  readOnly = false,
  ...inputProps
}) {
  return (
    <div className="ad-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <Required /> : !hideOptional && <Optional />}
      </label>
      <div
        className={`ad-input${error ? ' ad-input--invalid' : ''}${readOnly ? ' ad-input--readonly' : ''}${trailing ? ' ad-input--trailing' : ''}`}
      >
        <Icon size={20} />
        {prefix && (
          <span className="ad-input__prefix" aria-hidden="true">
            {prefix}
          </span>
        )}
        <input
          id={id}
          required={required}
          readOnly={readOnly}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy(error && `${id}-error`, help && `${id}-help`)}
          {...inputProps}
        />
        {trailing}
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
      {help && (
        <p id={`${id}-help`} className="ad-hint">
          {help}
        </p>
      )}
    </div>
  );
}

/** `<select>` berikon dengan gaya input admin. `options` = [{ value, label }]. */
export function SelectField({
  id,
  label,
  icon: Icon,
  options,
  placeholder,
  error,
  required = true,
  ...selectProps
}) {
  return (
    <div className="ad-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <Required /> : <Optional />}
      </label>
      <div className={`ad-input ad-input--select${error ? ' ad-input--invalid' : ''}`}>
        <Icon size={20} />
        <select
          id={id}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...selectProps}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon size={20} className="ad-input__chevron" />
      </div>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/** Textarea dengan penghitung karakter dan teks bantuan. */
export function TextAreaField({
  id,
  label,
  value,
  maxLength,
  help,
  error,
  required = false,
  short = false,
  ...textareaProps
}) {
  return (
    <div className="ad-field">
      <label htmlFor={id} className="form-label">
        {label}
        {required ? <Required /> : <Optional />}
      </label>
      <textarea
        id={id}
        className={`form-textarea ad-textarea${short ? ' ad-textarea--short' : ''}`}
        value={value}
        maxLength={maxLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(error && `${id}-error`, help && `${id}-help`, `${id}-count`)}
        {...textareaProps}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
      <div className="ad-hint-row">
        <span id={`${id}-help`} className="ad-hint">
          {help}
        </span>
        <span id={`${id}-count`} className="form-counter">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}
