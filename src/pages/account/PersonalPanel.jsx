import { useEffect, useId, useRef, useState } from 'react';
import { updateAccount } from '@/features/account/accountApi';
import { PHONE_PATTERN, normalizePhone, toApiPhone } from '@/features/auth/phone';
import { PencilIcon, SpinnerIcon } from '@/components/ui/icons';
import { Field, FormStatus, PanelHead } from './accountParts';
import { IDLE, displayPhone, fieldErrorsFrom, useSessionUpdate } from './accountUtils';

const NAME_MAX = 100;

function validateProfile({ name, phone }) {
  const errors = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = 'Nama lengkap wajib diisi.';
  else if (trimmed.length < 2) errors.name = 'Nama lengkap minimal 2 karakter.';
  if (!phone.trim()) errors.phone = 'Nomor HP wajib diisi.';
  else if (!PHONE_PATTERN.test(normalizePhone(phone)))
    errors.phone = 'Nomor HP belum valid, contoh: 81234567890.';
  return errors;
}

/** Data Diri: nama & nomor HP (dipakai di Detail Pesanan), lalu email (hanya tampil). */
export default function PersonalPanel({ user }) {
  const id = useId();
  const updateSession = useSessionUpdate();
  const editRef = useRef(null);
  const initialForm = () => ({
    name: user.name ?? '',
    phone: normalizePhone(String(user.phone ?? '')),
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(IDLE);
  const saving = status.state === 'saving';

  useEffect(() => {
    if (editing) document.getElementById(`${id}-name`)?.focus();
  }, [editing, id]);

  const startEdit = () => {
    setForm(initialForm());
    setErrors({});
    setStatus(IDLE);
    setEditing(true);
  };

  const closeEdit = (nextStatus = IDLE) => {
    setEditing(false);
    setErrors({});
    setStatus(nextStatus);
    requestAnimationFrame(() => editRef.current?.focus());
  };

  const update = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = validateProfile(form);
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${id}-${next.name ? 'name' : 'phone'}`)?.focus();
      setStatus(IDLE);
      return;
    }
    const changes = {};
    const name = form.name.trim();
    if (name !== user.name) changes.name = name;
    if (normalizePhone(form.phone) !== normalizePhone(String(user.phone ?? ''))) {
      changes.phone = toApiPhone(form.phone);
    }
    if (!Object.keys(changes).length) {
      closeEdit({ state: 'info', message: 'Tidak ada perubahan.' });
      return;
    }
    setStatus({ state: 'saving', message: '' });
    try {
      updateSession(await updateAccount(changes));
      closeEdit({ state: 'done', message: 'Data diri disimpan.' });
    } catch (error) {
      const fields = fieldErrorsFrom(error);
      setErrors(fields);
      setStatus({
        state: 'error',
        message: Object.keys(fields).length
          ? 'Periksa lagi isian yang ditandai.'
          : error.message || 'Data diri gagal disimpan.',
      });
    }
  };

  return (
    <section className="profile-panel" aria-labelledby={`${id}-title`}>
      <PanelHead
        id={`${id}-title`}
        title="Data Diri"
        description="Nama dan nomor HP ini terisi otomatis di Detail Pesanan."
        action={
          !editing && (
            <button
              ref={editRef}
              type="button"
              className="btn btn--outline btn--sm"
              onClick={startEdit}
            >
              <PencilIcon size={18} />
              Ubah data diri
            </button>
          )
        }
      />

      {editing ? (
        <form
          className="profile-form profile-subform"
          onSubmit={submit}
          noValidate
          aria-labelledby={`${id}-form-title`}
        >
          <h3 id={`${id}-form-title`} className="profile-subform__title">
            Ubah data diri
          </h3>
          <div className="profile-form__grid">
            <Field id={`${id}-name`} label="Nama lengkap" required error={errors.name}>
              {({ describedBy, invalid }) => (
                <input
                  id={`${id}-name`}
                  type="text"
                  autoComplete="name"
                  className="input-shell__control"
                  value={form.name}
                  onChange={update('name')}
                  maxLength={NAME_MAX}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
            <Field
              id={`${id}-phone`}
              label="Nomor HP"
              required
              prefix="+62"
              hint="Dipakai penyedia hanya bila darurat."
              error={errors.phone}
            >
              {({ describedBy, invalid }) => (
                <input
                  id={`${id}-phone`}
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="input-shell__control"
                  placeholder="81234567890"
                  value={form.phone}
                  onChange={update('phone')}
                  aria-invalid={invalid}
                  aria-describedby={describedBy}
                />
              )}
            </Field>
          </div>
          <div className="profile-form__actions">
            <button
              type="submit"
              className="btn btn--primary btn--sm"
              disabled={saving}
              aria-busy={saving}
            >
              {saving && <SpinnerIcon size={18} className="spin" />}
              {saving ? 'Menyimpan…' : 'Simpan perubahan'}
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => closeEdit()}
              disabled={saving}
            >
              Batal
            </button>
            <FormStatus status={status} />
          </div>
        </form>
      ) : (
        <>
          <dl className="profile-facts">
            <div>
              <dt>Nama lengkap</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Nomor HP</dt>
              <dd>{user.phone ? displayPhone(user.phone) : 'Belum diisi'}</dd>
            </div>
          </dl>
          <FormStatus status={status} />
        </>
      )}

      <div className="profile-email">
        <div className="profile-email__text">
          <p className="profile-email__label">Email</p>
          <p className="profile-email__value">{user.email ?? 'Belum ada email'}</p>
        </div>
      </div>
    </section>
  );
}
