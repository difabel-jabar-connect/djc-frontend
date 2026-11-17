import { useEffect, useId, useRef, useState } from 'react';
import { updateAccount, updateEmail } from '@/features/account/accountApi';
import { PHONE_PATTERN, normalizePhone, toApiPhone } from '@/features/auth/phone';
import { GoogleMarkIcon, PencilIcon, SpinnerIcon } from '@/components/ui/icons';
import { Field, FormStatus, PanelHead, PasswordInput } from './accountParts';
import { IDLE, displayPhone, fieldErrorsFrom, useSessionUpdate } from './accountUtils';

const NAME_MAX = 100;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

/** Ubah email: email baru + kata sandi saat ini (khusus akun dengan kata sandi). */
function EmailForm({ user, onDone, onCancel }) {
  const id = useId();
  const updateSession = useSessionUpdate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(IDLE);
  const saving = status.state === 'saving';

  useEffect(() => {
    document.getElementById(`${id}-email`)?.focus();
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    const email = form.email.trim().toLowerCase();
    const next = {};
    if (!email) next.email = 'Email baru wajib diisi.';
    else if (!EMAIL_PATTERN.test(email))
      next.email = 'Format email belum benar, contoh: nama@email.com.';
    else if (email === user.email?.toLowerCase())
      next.email = 'Email baru sama dengan email saat ini.';
    if (!form.password) next.current_password = 'Kata sandi saat ini wajib diisi.';
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${id}-${next.email ? 'email' : 'password'}`)?.focus();
      return;
    }
    setStatus({ state: 'saving', message: '' });
    try {
      const updated = await updateEmail({ email, currentPassword: form.password });
      updateSession(updated);
      onDone(`Email diganti ke ${updated?.email ?? email}.`);
    } catch (error) {
      const fields = fieldErrorsFrom(error);
      if (error.code === 'CONFLICT') fields.email = error.message;
      setErrors(fields);
      setStatus(
        Object.keys(fields).length
          ? IDLE
          : { state: 'error', message: error.message || 'Email gagal diganti.' },
      );
      if (fields.email || fields.current_password) {
        document.getElementById(`${id}-${fields.email ? 'email' : 'password'}`)?.focus();
      }
    }
  };

  return (
    <form className="profile-subform" onSubmit={submit} noValidate aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="profile-subform__title">
        Ganti email
      </h3>
      <Field id={`${id}-email`} label="Email baru" required error={errors.email}>
        {({ describedBy, invalid }) => (
          <input
            id={`${id}-email`}
            type="email"
            autoComplete="email"
            className="input-shell__control"
            value={form.email}
            onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            maxLength={255}
          />
        )}
      </Field>
      <PasswordInput
        id={`${id}-password`}
        label="Kata sandi saat ini"
        toggleLabel="Tampilkan kata sandi saat ini"
        autoComplete="current-password"
        hint="Untuk memastikan yang mengganti email adalah Anda."
        value={form.password}
        onChange={(event) => setForm((f) => ({ ...f, password: event.target.value }))}
        error={errors.current_password}
      />
      <div className="profile-form__actions">
        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={saving}
          aria-busy={saving}
        >
          {saving && <SpinnerIcon size={18} className="spin" />}
          {saving ? 'Menyimpan…' : 'Simpan email'}
        </button>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={onCancel}
          disabled={saving}
        >
          Batal
        </button>
      </div>
      <FormStatus status={status} />
    </form>
  );
}

/** Data Diri: nama & nomor HP (dipakai di Detail Pesanan), lalu email. */
export default function PersonalPanel({ user }) {
  const id = useId();
  const updateSession = useSessionUpdate();
  const editRef = useRef(null);
  const editEmailRef = useRef(null);
  const google = user.has_password === false;
  const initialForm = () => ({
    name: user.name ?? '',
    phone: normalizePhone(String(user.phone ?? '')),
  });
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(IDLE);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(IDLE);
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

  const closeEmail = (message) => {
    setEditingEmail(false);
    setEmailStatus(message ? { state: 'done', message } : IDLE);
    requestAnimationFrame(() => editEmailRef.current?.focus());
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
        <div className="profile-email__row">
          <div className="profile-email__text">
            <p className="profile-email__label">Email</p>
            <p className="profile-email__value">{user.email ?? 'Belum ada email'}</p>
            {google && (
              <p className="field-hint profile-email__google">
                <GoogleMarkIcon size={16} />
                Terhubung dengan akun Google, jadi tidak bisa diubah di sini.
              </p>
            )}
          </div>
          {!google && !editingEmail && (
            <button
              ref={editEmailRef}
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => {
                setEmailStatus(IDLE);
                setEditingEmail(true);
              }}
            >
              <PencilIcon size={18} />
              Ganti email
            </button>
          )}
        </div>
        {editingEmail && (
          <EmailForm user={user} onDone={closeEmail} onCancel={() => closeEmail()} />
        )}
        {!editingEmail && <FormStatus status={emailStatus} />}
      </div>
    </section>
  );
}
