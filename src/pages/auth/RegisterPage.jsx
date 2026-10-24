import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { register } from '@/features/auth/authApi';
import { PASSWORD_MIN, passwordStrength } from '@/features/auth/password';
import { DOMICILE_OPTIONS } from '@/features/auth/registerOptions';
import { CATEGORIES } from '@/features/search/catalog';
import { PATHS } from '@/routes/paths';
import {
  CheckIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  GoogleMarkIcon,
  GridIcon,
  HeartIcon,
  InfoIcon,
  MailIcon,
  MapIcon,
  MapPinIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@/components/ui/icons';
import AuthIntro, { AuthPageFooter } from './AuthIntro';
import { AuthField, PasswordField } from './AuthFields';
import './auth.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Nomor seluler Indonesia tanpa 0/+62 di depan: 8xx, total 9–13 digit. */
const PHONE_PATTERN = /^8\d{8,12}$/;

const HIGHLIGHTS = [
  { text: 'Gratis dan mudah didaftarkan', icon: CircleCheckIcon },
  { text: 'Temukan layanan terdekat lewat peta', icon: MapIcon },
  { text: 'Dukung kemandirian alumni difabel', icon: HeartIcon },
];

const ROLES = {
  pengguna: {
    label: 'Pengguna',
    help: 'Untuk masyarakat yang ingin mencari dan memesan layanan.',
    submit: 'Daftar',
    apiRole: 'customer',
  },
  mitra: {
    label: 'Mitra Penyedia Layanan',
    help: 'Khusus alumni UPTD PPSGHD Jawa Barat. Akun akan diverifikasi oleh pengelola sebelum aktif.',
    submit: 'Daftar sebagai Mitra',
    apiRole: 'provider',
  },
};

const FIELD_ORDER = ['nama', 'email', 'wa', 'kota', 'kategori', 'sandi', 'sandi2', 'setuju'];

/** Hapus 0 / 62 / +62 di depan dan karakter non-angka. */
const normalizePhone = (value) => value.replace(/\D/g, '').replace(/^(62|0)/, '');

function validate(form) {
  const errors = {};
  const mitra = form.role === 'mitra';
  if (!form.name.trim()) errors.nama = 'Nama lengkap wajib diisi.';
  if (!form.email.trim()) errors.email = 'Email wajib diisi.';
  else if (!EMAIL_PATTERN.test(form.email.trim()))
    errors.email = 'Format email belum benar, contoh: nama@email.com.';
  if (!form.phone) errors.wa = 'Nomor WhatsApp wajib diisi.';
  else if (!PHONE_PATTERN.test(normalizePhone(form.phone)))
    errors.wa = 'Nomor WhatsApp belum valid, contoh: 81234567890.';
  if (mitra && !form.city) errors.kota = 'Pilih kota/kabupaten domisili.';
  if (mitra && !form.category) errors.kategori = 'Pilih kategori keahlian.';
  if (!form.password) errors.sandi = 'Kata sandi wajib diisi.';
  else if (form.password.length < PASSWORD_MIN)
    errors.sandi = `Kata sandi minimal ${PASSWORD_MIN} karakter.`;
  if (!form.confirm) errors.sandi2 = 'Ulangi kata sandi Anda.';
  else if (form.confirm !== form.password) errors.sandi2 = 'Konfirmasi kata sandi tidak sama.';
  if (!form.agree)
    errors.setuju = 'Anda perlu menyetujui Syarat & Ketentuan dan Kebijakan Privasi.';
  return errors;
}

function StrengthMeter({ password }) {
  const strength = passwordStrength(password);
  return (
    <div className="strength" aria-live="polite">
      <div className={`strength__bars strength__bars--${strength.tone}`} aria-hidden="true">
        {[1, 2, 3].map((level) => (
          <span key={level} className={level <= strength.score ? 'is-on' : undefined} />
        ))}
      </div>
      <span className="strength__text">
        Kekuatan sandi: <strong>{strength.label}</strong> · gunakan huruf, angka, dan simbol.
      </span>
    </div>
  );
}

/** Halaman Daftar Akun (US-CUST-01) — Pengguna atau Mitra Penyedia Layanan (?peran=mitra). */
export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    role: searchParams.get('peran') === 'mitra' ? 'mitra' : 'pengguna',
    name: '',
    email: '',
    phone: '',
    city: '',
    category: '',
    password: '',
    confirm: '',
    agree: false,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const role = ROLES[form.role];
  const isMitra = form.role === 'mitra';
  useDocumentTitle(isMitra ? 'Daftar Mitra' : 'Daftar Akun');

  const update = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    const next = { ...form, [key]: value };
    setForm(next);
    if (Object.keys(errors).length) setErrors(validate(next));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((key) => nextErrors[key]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setStatus({ state: 'loading', message: '' });
    try {
      const email = form.email.trim();
      await register({
        role: role.apiRole,
        name: form.name.trim(),
        email,
        phone: `+62${normalizePhone(form.phone)}`,
        password: form.password,
        ...(isMitra && { city: form.city, category: form.category }),
      });
      navigate(PATHS.registerSuccess, { state: { email, role: form.role } });
    } catch (error) {
      const message =
        error?.status === 409
          ? 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.'
          : error?.message || 'Terjadi kesalahan. Silakan coba lagi.';
      setStatus({ state: 'error', message });
    }
  };

  const loading = status.state === 'loading';

  return (
    <div className="auth-page">
      <AuthIntro
        title="Mulai Terhubung Bersama Kami!"
        text="Daftar sekarang untuk menemukan layanan dari alumni difabel terdekat, atau tawarkan keahlian Anda kepada masyarakat Jawa Barat."
        highlights={HIGHLIGHTS}
      />

      <main id="main-content" tabIndex={-1} className="auth-main">
        <form
          className="auth-card auth-card--wide"
          aria-labelledby="form-title"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="auth-card__head">
            <h2 id="form-title">Daftar Akun Baru</h2>
            <p>Lengkapi data berikut untuk membuat akun.</p>
          </div>

          {status.state === 'error' && (
            <p className="auth-alert" role="alert">
              {status.message}
            </p>
          )}

          <fieldset className="role-switch">
            <legend className="auth-label">Daftar sebagai</legend>
            <div className="role-switch__options">
              {Object.entries(ROLES).map(([key, option]) => (
                <label key={key} className="role-switch__option">
                  <input
                    type="radio"
                    name="peran"
                    value={key}
                    checked={form.role === key}
                    onChange={update('role')}
                    aria-describedby="peran-help"
                  />
                  <span>
                    {form.role === key && <CheckIcon size={18} />}
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
            <p id="peran-help" className="role-switch__help" aria-live="polite">
              <InfoIcon size={16} />
              {role.help}
            </p>
          </fieldset>

          <AuthField id="nama" label="Nama Lengkap" icon={UserIcon} error={errors.nama}>
            {({ describedBy, invalid }) => (
              <input
                id="nama"
                type="text"
                autoComplete="name"
                required
                placeholder="Masukkan nama lengkap"
                value={form.name}
                onChange={update('name')}
                aria-invalid={invalid}
                aria-describedby={describedBy}
              />
            )}
          </AuthField>

          <AuthField id="email" label="Email" icon={MailIcon} error={errors.email}>
            {({ describedBy, invalid }) => (
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="contoh@email.com"
                value={form.email}
                onChange={update('email')}
                aria-invalid={invalid}
                aria-describedby={describedBy}
              />
            )}
          </AuthField>

          <AuthField
            id="wa"
            label="Nomor WhatsApp"
            error={errors.wa}
            prefix={
              <span className="auth-input__prefix" aria-hidden="true">
                +62
              </span>
            }
          >
            {({ describedBy, invalid }) => (
              <input
                id="wa"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                placeholder="81234567890"
                value={form.phone}
                onChange={update('phone')}
                aria-invalid={invalid}
                aria-describedby={describedBy ? `${describedBy} wa-prefix` : 'wa-prefix'}
              />
            )}
          </AuthField>
          <span id="wa-prefix" className="visually-hidden">
            Kode negara +62 sudah ditambahkan otomatis.
          </span>

          {isMitra && (
            <>
              <AuthField
                id="kota"
                label="Kota/Kabupaten Domisili"
                icon={MapPinIcon}
                error={errors.kota}
              >
                {({ describedBy, invalid }) => (
                  <>
                    <select
                      id="kota"
                      required
                      className={`auth-select${form.city ? '' : ' auth-select--placeholder'}`}
                      value={form.city}
                      onChange={update('city')}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                    >
                      <option value="">Pilih kota/kabupaten</option>
                      {DOMICILE_OPTIONS.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="auth-select__chevron" />
                  </>
                )}
              </AuthField>

              <AuthField
                id="kategori"
                label="Kategori Keahlian"
                icon={GridIcon}
                error={errors.kategori}
              >
                {({ describedBy, invalid }) => (
                  <>
                    <select
                      id="kategori"
                      required
                      className={`auth-select${form.category ? '' : ' auth-select--placeholder'}`}
                      value={form.category}
                      onChange={update('category')}
                      aria-invalid={invalid}
                      aria-describedby={describedBy}
                    >
                      <option value="">Pilih kategori keahlian</option>
                      {CATEGORIES.map((category) => (
                        <option key={category.slug} value={category.slug}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="auth-select__chevron" />
                  </>
                )}
              </AuthField>
            </>
          )}

          <PasswordField
            id="sandi"
            label="Kata Sandi"
            toggleLabel="Tampilkan kata sandi"
            placeholder={`Minimal ${PASSWORD_MIN} karakter`}
            value={form.password}
            onChange={update('password')}
            error={errors.sandi}
            help={<StrengthMeter password={form.password} />}
          />

          <PasswordField
            id="sandi2"
            label="Konfirmasi Kata Sandi"
            toggleLabel="Tampilkan konfirmasi kata sandi"
            placeholder="Ulangi kata sandi"
            value={form.confirm}
            onChange={update('confirm')}
            error={errors.sandi2}
          />

          <div className="field">
            <div className="auth-agree">
              <input
                id="setuju"
                type="checkbox"
                required
                checked={form.agree}
                onChange={update('agree')}
                aria-invalid={Boolean(errors.setuju)}
                aria-describedby={errors.setuju ? 'setuju-error' : undefined}
              />
              <label htmlFor="setuju">
                Saya menyetujui <Link to={`${PATHS.about}#syarat`}>Syarat &amp; Ketentuan</Link> dan{' '}
                <Link to={`${PATHS.about}#privasi`}>Kebijakan Privasi</Link>
              </label>
            </div>
            {errors.setuju && (
              <p id="setuju-error" className="field-error">
                {errors.setuju}
              </p>
            )}
          </div>

          {isMitra && (
            <div className="auth-notice">
              <span className="icon-tile icon-tile--primary" aria-hidden="true">
                <ShieldCheckIcon size={18} />
              </span>
              <p>Setelah mendaftar, lengkapi profil dan tunggu verifikasi dari UPTD PPSGHD.</p>
            </div>
          )}

          <button
            type="submit"
            className="btn btn--primary btn--block auth-submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Memproses…' : role.submit}
          </button>

          <div className="auth-divider" aria-hidden="true">
            atau
          </div>

          <button
            type="button"
            className="auth-google"
            onClick={() =>
              setStatus({
                state: 'info',
                message: 'Daftar dengan Google belum tersedia. Silakan isi form di atas.',
              })
            }
          >
            <GoogleMarkIcon />
            Daftar dengan Google
          </button>
          {status.state === 'info' && (
            <p className="field-hint auth-info" role="status">
              {status.message}
            </p>
          )}

          <div className="auth-card__foot">
            <p>
              Sudah punya akun?{' '}
              <Link to={PATHS.login} className="auth-link auth-link--strong">
                Masuk
              </Link>
            </p>
          </div>
        </form>

        <AuthPageFooter />
      </main>
    </div>
  );
}
