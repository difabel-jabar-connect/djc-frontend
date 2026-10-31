import { useId, useState } from 'react';
import Drawer from '@/components/ui/Drawer';
import {
  BriefcaseIcon,
  ChevronDownIcon,
  HistoryIcon,
  InfoIcon,
  KeyIcon,
  MailIcon,
  MapPinIcon,
  MessageTextIcon,
  PhoneIcon,
  ShieldIcon,
  UserIcon,
  UserPlusIcon,
  XIcon,
} from '@/components/ui/icons';
import {
  ACCOUNT_FIELDS,
  ACCOUNT_TYPES,
  INVITE_HOURS,
  JABAR_REGIONS,
  emptyAccountForm,
  validateAccount,
} from '@/features/admin/accountForm';
import { REASON_MAX } from '@/features/admin/adminFormat';
import { FieldError, Required, TextField } from './FormFields';

const TYPE_ICONS = { pengguna: UserIcon, pengelola: ShieldIcon };

const ACCESS_OPTIONS = [
  {
    value: 'undangan',
    label: 'Kirim undangan via email',
    recommended: true,
    description: `User akan menerima tautan untuk membuat kata sandi sendiri. Tautan berlaku ${INVITE_HOURS} jam.`,
  },
  {
    value: 'sandi',
    label: 'Buat kata sandi sementara',
    description:
      'Berikan kata sandi langsung, misalnya saat mendaftarkan user secara tatap muka. Kata sandi dibuat otomatis setelah akun dibuat.',
  },
];

function AccountForm({ formId, initialType, takenEmails, onSubmit, ids }) {
  const [form, setForm] = useState(() => emptyAccountForm(initialType));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validateAccount(form, takenEmails) : {};
  const staff = form.type === 'pengelola';
  const meta = ACCOUNT_TYPES[form.type];
  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  const fieldId = (key) => `${formId}-${key}`;

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validateAccount(form, takenEmails);
    const first = ACCOUNT_FIELDS.find((key) => found[key]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    onSubmit(form);
  };

  const TypeIcon = TYPE_ICONS[form.type];

  return (
    <>
      <div className="drawer__head">
        <div className="drawer__head-main">
          <span className="ad-head-icon" aria-hidden="true">
            {staff ? (
              <ShieldIcon size={24} strokeWidth={2.25} />
            ) : (
              <UserPlusIcon size={24} strokeWidth={2.25} />
            )}
          </span>
          <div>
            <h2 id={ids.title} className="drawer__title">
              {meta.title}
            </h2>
            <p id={ids.desc} className="drawer__subtitle">
              {meta.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="drawer__close"
          aria-label="Tutup panel"
          onClick={ids.onClose}
        >
          <XIcon size={22} strokeWidth={2} />
        </button>
      </div>

      <form id={formId} className="drawer__body" noValidate onSubmit={handleSubmit}>
        <fieldset className="ad-fieldset">
          <legend className="form-label">
            Jenis Akun
            <Required />
          </legend>
          <div className="ad-segment">
            {Object.entries(ACCOUNT_TYPES).map(([value, type]) => {
              const Icon = TYPE_ICONS[value];
              return (
                <label key={value} className="ad-segment__option">
                  <input
                    type="radio"
                    name={`${formId}-type`}
                    value={value}
                    checked={form.type === value}
                    onChange={() => setForm((prev) => ({ ...prev, type: value }))}
                    aria-describedby={`${formId}-type-help`}
                  />
                  <span className="ad-segment__face">
                    <Icon size={18} strokeWidth={2.25} />
                    {type.label}
                  </span>
                </label>
              );
            })}
          </div>
          <p id={`${formId}-type-help`} className="ad-hint" aria-live="polite">
            <InfoIcon size={16} />
            {meta.help}
          </p>
        </fieldset>

        <section className="ad-dsection" aria-labelledby={`${formId}-akun`}>
          <h3 id={`${formId}-akun`} className="ad-dsection__title">
            <TypeIcon size={18} />
            Data Akun
          </h3>
          <TextField
            id={fieldId('name')}
            label="Nama Lengkap"
            icon={UserIcon}
            autoComplete="off"
            placeholder="Masukkan nama lengkap"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
          />
          <TextField
            id={fieldId('email')}
            label="Email"
            icon={MailIcon}
            type="email"
            autoComplete="off"
            placeholder={staff ? 'nama@uptdppsghd.id' : 'nama@email.com'}
            value={form.email}
            onChange={set('email')}
            help={meta.emailHelp}
            error={errors.email}
          />
          <TextField
            id={fieldId('phone')}
            label="Nomor WhatsApp"
            icon={PhoneIcon}
            prefix="+62"
            type="tel"
            inputMode="numeric"
            autoComplete="off"
            placeholder="81234567890"
            value={form.phone}
            onChange={set('phone')}
            help="Tanpa angka 0 di depan."
            error={errors.phone}
          />
          <div className="ad-field">
            <label htmlFor={fieldId('region')} className="form-label">
              Kota/Kabupaten
              <Required />
            </label>
            <div
              className={`ad-input ad-input--select${errors.region ? ' ad-input--invalid' : ''}`}
            >
              <MapPinIcon size={20} />
              <select
                id={fieldId('region')}
                required
                value={form.region}
                onChange={set('region')}
                aria-invalid={Boolean(errors.region)}
                aria-describedby={errors.region ? `${fieldId('region')}-error` : undefined}
              >
                <option value="">Pilih kota/kabupaten</option>
                {JABAR_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={20} className="ad-input__chevron" />
            </div>
            <FieldError id={`${fieldId('region')}-error`}>{errors.region}</FieldError>
          </div>
        </section>

        {staff && (
          <section className="ad-dsection" aria-labelledby={`${formId}-pengelola`}>
            <h3 id={`${formId}-pengelola`} className="ad-dsection__title">
              <ShieldIcon size={18} />
              Data Pengelola
            </h3>
            <TextField
              id={fieldId('position')}
              label="Jabatan / Unit Kerja"
              icon={BriefcaseIcon}
              placeholder="Contoh: Staf Pemberdayaan Alumni"
              value={form.position}
              onChange={set('position')}
              error={errors.position}
            />
            <p className="ad-callout tone-warning" role="note">
              <ShieldIcon size={20} strokeWidth={2.25} />
              Akun Pengelola memiliki akses penuh ke Dashboard Admin, termasuk verifikasi penyedia,
              kelola user, dan moderasi ulasan.
            </p>
          </section>
        )}

        <fieldset className="ad-fieldset ad-dsection">
          <legend className="ad-dsection__title">
            <KeyIcon size={18} />
            Akses Masuk
          </legend>
          <div className="ad-radio-cards">
            {ACCESS_OPTIONS.map((option) => (
              <label key={option.value} className="ad-radio-card">
                <input
                  type="radio"
                  name={`${formId}-access`}
                  value={option.value}
                  checked={form.access === option.value}
                  onChange={() => setForm((prev) => ({ ...prev, access: option.value }))}
                />
                <span className="ad-radio-card__dot" aria-hidden="true" />
                <span className="ad-radio-card__label">
                  {option.label}
                  {option.recommended && <span className="ad-recommended">Disarankan</span>}
                </span>
                <span className="ad-radio-card__desc">{option.description}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="ad-dsection" aria-labelledby={`${formId}-catatan`}>
          <h3 id={`${formId}-catatan`} className="ad-dsection__title">
            <MessageTextIcon size={18} />
            Catatan
          </h3>
          <div className="ad-field">
            <label htmlFor={fieldId('reason')} className="form-label">
              Alasan pembuatan akun
              {staff ? <Required /> : <span className="form-label__optional"> (opsional)</span>}
            </label>
            <textarea
              id={fieldId('reason')}
              className="form-textarea ad-textarea"
              maxLength={REASON_MAX}
              required={staff}
              placeholder="Contoh: staf baru bidang pemberdayaan alumni"
              value={form.reason}
              onChange={set('reason')}
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={[
                errors.reason && `${fieldId('reason')}-error`,
                `${fieldId('reason')}-hint`,
              ]
                .filter(Boolean)
                .join(' ')}
            />
            <FieldError id={`${fieldId('reason')}-error`}>{errors.reason}</FieldError>
            <div className="ad-hint-row">
              <span id={`${fieldId('reason')}-hint`} className="ad-hint">
                <HistoryIcon size={16} />
                Tercatat di Audit Log.
              </span>
              <span className="form-counter">
                {form.reason.length}/{REASON_MAX}
              </span>
            </div>
          </div>
        </section>
      </form>

      <div className="drawer__foot">
        <button type="button" className="btn btn--outline btn--md" onClick={ids.onClose}>
          Batal
        </button>
        <button type="submit" form={formId} className="btn btn--primary btn--md">
          <UserPlusIcon size={18} strokeWidth={2.25} />
          {meta.submit}
        </button>
      </div>
    </>
  );
}

/**
 * Drawer Tambah Akun (desain Tambah Akun · Pengguna / Pengelola).
 * `type` = jenis awal dari menu; `null` = tertutup. `onSubmit(form)` dipanggil bila valid.
 */
export default function AddAccountDrawer({ type, takenEmails, onClose, onSubmit }) {
  const id = useId();
  const ids = { title: `${id}-title`, desc: `${id}-desc`, onClose };
  return (
    <Drawer open={Boolean(type)} onClose={onClose} labelledBy={ids.title} describedBy={ids.desc}>
      {type && (
        <AccountForm
          key={type}
          formId={`${id}-form`}
          initialType={type}
          takenEmails={takenEmails}
          onSubmit={onSubmit}
          ids={ids}
        />
      )}
    </Drawer>
  );
}
