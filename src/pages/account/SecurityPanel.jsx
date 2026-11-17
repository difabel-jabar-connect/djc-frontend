import { useId, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/context/useAuth';
import { changePassword } from '@/features/account/accountApi';
import { checkPasswordRequirements } from '@/features/auth/password';
import { PATHS } from '@/routes/paths';
import { PasswordRequirements } from '@/pages/auth/AuthFields';
import { GoogleMarkIcon, LogOutIcon, SpinnerIcon } from '@/components/ui/icons';
import { FormStatus, PanelHead, PasswordInput } from './accountParts';
import { IDLE, fieldErrorsFrom } from './accountUtils';

const EMPTY = { current: '', next: '', confirm: '' };

function PasswordForm() {
  const id = useId();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(IDLE);
  const saving = status.state === 'saving';
  const check = checkPasswordRequirements(form.next);

  const update = (key) => (event) => {
    setForm((f) => ({ ...f, [key]: event.target.value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const focusFirst = (fields) => {
    const key = ['current', 'next', 'confirm'].find((k) => fields[k]);
    if (key) document.getElementById(`${id}-${key}`)?.focus();
  };

  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.current) next.current = 'Kata sandi saat ini wajib diisi.';
    if (!form.next) next.next = 'Kata sandi baru wajib diisi.';
    else if (!check.valid) next.next = 'Kata sandi baru belum memenuhi semua syarat di bawah.';
    else if (form.next === form.current)
      next.next = 'Kata sandi baru harus berbeda dari kata sandi saat ini.';
    if (!form.confirm) next.confirm = 'Ulangi kata sandi baru.';
    else if (form.confirm !== form.next) next.confirm = 'Kata sandi tidak sama.';
    setErrors(next);
    if (Object.keys(next).length) {
      setStatus(IDLE);
      focusFirst(next);
      return;
    }
    setStatus({ state: 'saving', message: '' });
    try {
      await changePassword({ currentPassword: form.current, newPassword: form.next });
      setForm(EMPTY);
      setStatus({
        state: 'done',
        message: 'Kata sandi diganti. Pakai kata sandi baru saat masuk berikutnya.',
      });
    } catch (error) {
      const api = fieldErrorsFrom(error);
      const fields = { current: api.current_password, next: api.new_password };
      setErrors(fields);
      setStatus({
        state: 'error',
        message:
          fields.current || fields.next
            ? 'Periksa lagi isian yang ditandai.'
            : error.message || 'Kata sandi gagal diganti.',
      });
      focusFirst(fields);
    }
  };

  return (
    <form className="profile-form" onSubmit={submit} noValidate aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`} className="profile-subform__title">
        Ganti kata sandi
      </h3>
      <div className="profile-form__grid">
        <PasswordInput
          id={`${id}-current`}
          label="Kata sandi saat ini"
          toggleLabel="Tampilkan kata sandi saat ini"
          autoComplete="current-password"
          value={form.current}
          onChange={update('current')}
          error={errors.current}
        />
      </div>
      <div className="profile-form__grid">
        <PasswordInput
          id={`${id}-next`}
          label="Kata sandi baru"
          toggleLabel="Tampilkan kata sandi baru"
          autoComplete="new-password"
          value={form.next}
          onChange={update('next')}
          error={errors.next}
          help={<PasswordRequirements check={check} />}
        />
        <PasswordInput
          id={`${id}-confirm`}
          label="Ulangi kata sandi baru"
          toggleLabel="Tampilkan ulangan kata sandi baru"
          autoComplete="new-password"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm}
        />
      </div>
      <div className="profile-form__actions">
        <button
          type="submit"
          className="btn btn--primary btn--sm"
          disabled={saving}
          aria-busy={saving}
        >
          {saving && <SpinnerIcon size={18} className="spin" />}
          {saving ? 'Menyimpan…' : 'Ganti kata sandi'}
        </button>
        <FormStatus status={status} />
      </div>
    </form>
  );
}

/** Keamanan: ganti kata sandi (akun email) atau arahan untuk akun Google, lalu Keluar. */
export default function SecurityPanel({ user }) {
  const id = useId();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [leaving, setLeaving] = useState(false);
  const google = user.has_password === false;

  const logout = async () => {
    setLeaving(true);
    await signOut();
    navigate(PATHS.home, { replace: true });
  };

  return (
    <section className="profile-panel" aria-labelledby={`${id}-title`}>
      <PanelHead id={`${id}-title`} title="Keamanan" />

      {google ? (
        <div className="profile-note">
          <GoogleMarkIcon size={20} />
          <p>
            Anda masuk dengan Google, jadi akun ini belum punya kata sandi. Kalau ingin juga bisa
            masuk dengan email dan kata sandi, buat kata sandi lewat{' '}
            <Link to={PATHS.forgotPassword}>Lupa Kata Sandi</Link>.
          </p>
        </div>
      ) : (
        <PasswordForm />
      )}

      <div className="profile-logout">
        <div>
          <h3 className="profile-subform__title">Keluar</h3>
          <p className="field-hint">
            Akhiri sesi di perangkat ini. Data dan alamat Anda tetap tersimpan.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--outline btn--sm profile-logout__btn"
          onClick={logout}
          disabled={leaving}
          aria-busy={leaving}
        >
          {leaving ? <SpinnerIcon size={18} className="spin" /> : <LogOutIcon size={18} />}
          Keluar
        </button>
      </div>
    </section>
  );
}
