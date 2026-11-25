import { useId, useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import { BriefcaseIcon, XIcon } from '@/components/ui/icons';
import { apiErrorMessage } from '@/lib/api/client';

/** Dialog pembuatan akun Mitra Penyedia langsung ke `POST /admin/providers` (mode live). */
export default function AddProviderDialog({ open, onClose, onCreate }) {
  const id = useId();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '+62',
    password: '',
    alumni_reg_no: '',
    city: 'Kota Bandung',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setError('Nama lengkap minimal 2 karakter.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError('Format email tidak valid.');
      return;
    }
    if (!/^\+62\d{8,13}$/.test(form.phone.trim())) {
      setError('Nomor telepon harus diawali +62, contoh +6281234567890.');
      return;
    }
    if (form.password.length < 8) {
      setError('Kata sandi awal minimal 8 karakter.');
      return;
    }
    if (!form.alumni_reg_no.trim()) {
      setError('Nomor registrasi alumni wajib diisi.');
      return;
    }
    if (form.city.trim().length < 2) {
      setError('Kota/Kabupaten minimal 2 karakter.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      await onCreate(form);
    } catch (err) {
      setError(apiErrorMessage(err, 'Gagal membuat akun mitra penyedia.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} labelledBy={`${id}-title`}>
      <form className="dialog__form" noValidate onSubmit={handleSubmit}>
        <div className="dialog__head">
          <span className="dialog__icon dialog__icon--sm dialog__icon--primary" aria-hidden="true">
            <BriefcaseIcon size={22} strokeWidth={2.25} />
          </span>
          <div className="dialog__head-text">
            <h2 id={`${id}-title`} className="dialog__title ad-dialog-title">
              Tambah Akun Mitra Penyedia
            </h2>
            <p className="dialog__desc">
              Akun mitra akan dibuat berstatus menunggu verifikasi hingga alamat & lokasi
              dilengkapi.
            </p>
          </div>
          <button
            type="button"
            className="dialog__close"
            aria-label="Tutup dialog"
            onClick={onClose}
            disabled={busy}
          >
            <XIcon size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="ad-field">
          <label htmlFor={`${id}-name`} className="form-label">
            Nama lengkap *
          </label>
          <input
            id={`${id}-name`}
            className="ad-text-input"
            type="text"
            required
            maxLength={100}
            value={form.name}
            disabled={busy}
            onChange={(event) => set('name', event.target.value)}
          />
        </div>

        <div className="ad-field">
          <label htmlFor={`${id}-email`} className="form-label">
            Email *
          </label>
          <input
            id={`${id}-email`}
            className="ad-text-input"
            type="email"
            required
            maxLength={255}
            value={form.email}
            disabled={busy}
            onChange={(event) => set('email', event.target.value)}
          />
        </div>

        <div className="ad-field">
          <label htmlFor={`${id}-phone`} className="form-label">
            Nomor WhatsApp (+62) *
          </label>
          <input
            id={`${id}-phone`}
            className="ad-text-input"
            type="tel"
            required
            placeholder="+6281234567890"
            value={form.phone}
            disabled={busy}
            onChange={(event) => set('phone', event.target.value)}
          />
        </div>

        <div className="ad-field">
          <label htmlFor={`${id}-alumni`} className="form-label">
            Nomor Registrasi Alumni *
          </label>
          <input
            id={`${id}-alumni`}
            className="ad-text-input"
            type="text"
            required
            maxLength={50}
            placeholder="Contoh: AL-2026-010"
            value={form.alumni_reg_no}
            disabled={busy}
            onChange={(event) => set('alumni_reg_no', event.target.value)}
          />
        </div>

        <div className="ad-field">
          <label htmlFor={`${id}-city`} className="form-label">
            Kota / Kabupaten *
          </label>
          <input
            id={`${id}-city`}
            className="ad-text-input"
            type="text"
            required
            maxLength={50}
            value={form.city}
            disabled={busy}
            onChange={(event) => set('city', event.target.value)}
          />
        </div>

        <div className="ad-field">
          <label htmlFor={`${id}-password`} className="form-label">
            Kata sandi awal (min. 8 karakter) *
          </label>
          <input
            id={`${id}-password`}
            className="ad-text-input"
            type="password"
            required
            minLength={8}
            maxLength={72}
            value={form.password}
            disabled={busy}
            onChange={(event) => set('password', event.target.value)}
          />
        </div>

        {error && (
          <p className="ad-callout tone-danger" role="alert">
            {error}
          </p>
        )}

        <div className="dialog__actions ad-actions-end">
          <button
            type="button"
            className="btn btn--outline btn--md"
            onClick={onClose}
            disabled={busy}
          >
            Batal
          </button>
          <button type="submit" className="btn btn--primary btn--md" disabled={busy}>
            {busy ? 'Menyimpan...' : 'Buat Akun Mitra'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
