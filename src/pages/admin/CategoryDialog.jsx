import { useId, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { AlertCircleIcon, XIcon } from '@/components/ui/icons';
import { CATEGORY_ICON_LABELS } from '@/features/admin/adminData';
import { CategoryIcon } from './AdminParts';

const NAME_MAX = 40;
const DESCRIPTION_MAX = 120;

function CategoryForm({ ids, category, takenNames, onClose, onSave }) {
  const [values, setValues] = useState(() => ({
    name: category?.name ?? '',
    icon: category?.icon ?? 'sparkle',
    description: category?.description ?? '',
    active: category?.active ?? true,
  }));
  const [touched, setTouched] = useState(false);
  const name = values.name.trim();
  const duplicate = takenNames.includes(name.toLowerCase());
  const error = duplicate
    ? 'Nama kategori sudah ada.'
    : touched && !name
      ? 'Nama kategori wajib diisi.'
      : '';
  const valid = Boolean(name) && !duplicate;
  const set = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      className="dialog__form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (valid) onSave(values);
      }}
    >
      <div className="dialog__head">
        <h2 id={ids.title} className="dialog__title ad-dialog-title">
          {category ? 'Ubah Kategori' : 'Tambah Kategori'}
        </h2>
        <button type="button" className="dialog__close" aria-label="Tutup dialog" onClick={onClose}>
          <XIcon size={20} strokeWidth={2} />
        </button>
      </div>

      <div className="ad-field">
        <label htmlFor={ids.name} className="form-label">
          Nama kategori
          <span className="form-required" aria-hidden="true">
            {' '}
            *
          </span>
          <span className="visually-hidden"> (wajib)</span>
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
        {error && (
          <p id={`${ids.name}-error`} className="ad-field-error">
            <AlertCircleIcon size={16} strokeWidth={2.25} />
            {error}
          </p>
        )}
      </div>

      <fieldset className="ad-fieldset">
        <legend className="form-label">Ikon kategori</legend>
        <div className="ad-icon-grid">
          {Object.entries(CATEGORY_ICON_LABELS).map(([key, label]) => (
            <label key={key} className="ad-icon-option">
              <input
                type="radio"
                name={ids.icon}
                value={key}
                checked={values.icon === key}
                onChange={() => set('icon', key)}
              />
              <span className="ad-icon-option__face">
                <CategoryIcon icon={key} size={22} />
                <span className="visually-hidden">Ikon {label}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="ad-field">
        <label htmlFor={ids.desc} className="form-label">
          Deskripsi <span className="form-label__optional">(opsional)</span>
        </label>
        <textarea
          id={ids.desc}
          className="form-textarea ad-textarea ad-textarea--short"
          maxLength={DESCRIPTION_MAX}
          placeholder="Contoh: perbaikan alat elektronik rumah tangga"
          value={values.description}
          onChange={(event) => set('description', event.target.value)}
        />
      </div>

      <div className="ad-switch-row">
        <span className="ad-switch-row__text">
          <span id={ids.switchLabel} className="form-label">
            Status Aktif
          </span>
          <span id={ids.switchDesc} className="ad-hint">
            Kategori tampil di pencarian dan Beranda.
          </span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={values.active}
          aria-labelledby={ids.switchLabel}
          aria-describedby={ids.switchDesc}
          className="ad-switch"
          onClick={() => set('active', !values.active)}
        >
          <span className="ad-switch__thumb" />
        </button>
      </div>

      <div className="ad-field">
        <span className="form-label" aria-hidden="true">
          Pratinjau di Beranda
        </span>
        <div className="ad-preview" aria-hidden="true">
          <span className="ad-preview__chip">
            <CategoryIcon icon={values.icon} size={18} />
            {name || 'Nama kategori'}
          </span>
        </div>
      </div>

      <div className="dialog__actions ad-actions-end">
        <button type="button" className="btn btn--outline btn--md" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="btn btn--primary btn--md" disabled={!valid}>
          Simpan
        </button>
      </div>
    </form>
  );
}

/** Modal Tambah/Ubah Kategori (desain Kategori · Modal Tambah). `category` null = tambah. */
export default function CategoryDialog({ open, category, categories, onClose, onSave }) {
  const id = useId();
  const ids = {
    title: `${id}-title`,
    name: `${id}-name`,
    icon: `${id}-icon`,
    desc: `${id}-desc`,
    switchLabel: `${id}-switch`,
    switchDesc: `${id}-switch-desc`,
  };
  const takenNames = categories
    .filter((c) => c.id !== category?.id)
    .map((c) => c.name.trim().toLowerCase());
  return (
    <Dialog open={open} onClose={onClose} labelledBy={ids.title}>
      <CategoryForm
        key={category?.id ?? 'baru'}
        ids={ids}
        category={category}
        takenNames={takenNames}
        onClose={onClose}
        onSave={onSave}
      />
    </Dialog>
  );
}
