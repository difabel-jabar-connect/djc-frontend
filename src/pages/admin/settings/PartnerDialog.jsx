import { useId, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { BuildingIcon, UsersIcon, XIcon } from '@/components/ui/icons';
import { FieldError, Required, TextAreaField } from '../FormFields';

const NAME_MAX = 60;
const DESCRIPTION_MAX = 120;

const ICON_OPTIONS = [
  { value: 'users', label: 'Komunitas', icon: UsersIcon },
  { value: 'building', label: 'Lembaga', icon: BuildingIcon },
];

function PartnerForm({ ids, partner, takenNames, onClose, onSave }) {
  const [values, setValues] = useState(() => ({
    name: partner?.name ?? '',
    description: partner?.description ?? '',
    icon: partner?.icon ?? 'building',
  }));
  const [touched, setTouched] = useState(false);
  const name = values.name.trim();
  const duplicate = takenNames.includes(name.toLowerCase());
  const error = duplicate
    ? 'Mitra dengan nama ini sudah ada.'
    : touched && !name
      ? 'Nama mitra wajib diisi.'
      : '';
  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="dialog__form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (name && !duplicate) onSave({ ...values, name, description: values.description.trim() });
        else document.getElementById(ids.name)?.focus();
      }}
    >
      <div className="dialog__head">
        <h2 id={ids.title} className="dialog__title ad-dialog-title">
          {partner ? 'Ubah Mitra' : 'Tambah Mitra'}
        </h2>
        <button type="button" className="dialog__close" aria-label="Tutup dialog" onClick={onClose}>
          <XIcon size={20} strokeWidth={2} />
        </button>
      </div>
      <p id={ids.desc} className="dialog__desc">
        Mitra tampil di bagian “Bekerja sama dengan” pada footer halaman publik.
      </p>

      <div className="ad-field">
        <label htmlFor={ids.name} className="form-label">
          Nama mitra
          <Required />
        </label>
        <input
          id={ids.name}
          className={`ad-text-input${error ? ' ad-text-input--invalid' : ''}`}
          type="text"
          required
          maxLength={NAME_MAX}
          value={values.name}
          onChange={(event) => set('name', event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${ids.name}-error` : undefined}
        />
        <FieldError id={`${ids.name}-error`}>{error}</FieldError>
      </div>

      <TextAreaField
        id={ids.description}
        label="Keterangan"
        short
        maxLength={DESCRIPTION_MAX}
        value={values.description}
        onChange={(event) => set('description', event.target.value)}
      />

      <fieldset className="ad-fieldset">
        <legend className="form-label">Ikon</legend>
        <div className="st-icon-options">
          {ICON_OPTIONS.map(({ value, label, icon: Icon }) => (
            <label key={value} className="st-icon-option">
              <input
                type="radio"
                name={`${ids.title}-icon`}
                value={value}
                checked={values.icon === value}
                onChange={() => set('icon', value)}
              />
              <Icon size={20} />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="dialog__actions">
        <button type="button" className="btn btn--outline btn--md" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="btn btn--primary btn--md">
          {partner ? 'Simpan Mitra' : 'Tambah Mitra'}
        </button>
      </div>
    </form>
  );
}

/** Dialog tambah/ubah mitra kolaborasi (perubahan masuk ke draf Informasi Platform). */
export default function PartnerDialog({ open, partner, partners, onClose, onSave }) {
  const id = useId();
  const ids = {
    title: `${id}-title`,
    desc: `${id}-desc`,
    name: `${id}-name`,
    description: `${id}-description`,
  };
  const takenNames = partners
    .filter((p) => p.id !== partner?.id)
    .map((p) => p.name.trim().toLowerCase());
  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy={ids.title}
      describedBy={ids.desc}
      className="dialog--xs"
    >
      <PartnerForm
        key={partner?.id ?? 'baru'}
        ids={ids}
        partner={partner}
        takenNames={takenNames}
        onClose={onClose}
        onSave={onSave}
      />
    </Dialog>
  );
}
