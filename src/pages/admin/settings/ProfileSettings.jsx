import { useId, useState } from 'react';
import {
  BriefcaseIcon,
  CheckIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { JABAR_REGIONS, formatPhone, normalizeLocalPhone } from '@/features/admin/accountForm';
import { formatDate, initialsOf } from '@/features/admin/adminFormat';
import { AVATAR_COLOR_OPTIONS } from '@/features/admin/settingsData';
import { validateProfile } from '@/features/admin/settingsForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Avatar, RoleBadge } from '../AdminParts';
import { SelectField, TextField } from '../FormFields';
import { SaveBar, SettingsCard } from './SettingsParts';

const FIELD_LABELS = {
  name: 'nama',
  phone: 'nomor WhatsApp',
  position: 'jabatan',
  region: 'kota',
  color: 'warna avatar',
};

const fromUser = (user) => ({
  name: user.name,
  phone: normalizeLocalPhone(user.phone),
  position: user.position ?? '',
  region: user.region ?? (JABAR_REGIONS.includes(`Kota ${user.city}`) ? `Kota ${user.city}` : ''),
  color: user.color,
});

const changedKeys = (saved, draft) =>
  Object.keys(FIELD_LABELS).filter(
    (key) => String(saved[key]).trim() !== String(draft[key]).trim(),
  );

/** Pengaturan · Profil Saya (desain Pengaturan · Profil Saya). */
export default function ProfileSettings() {
  useDocumentTitle('Pengaturan · Profil Saya');
  const id = useId();
  const { users, actor, updateProfile, run, notify } = useAdmin();
  const self = users.find((u) => u.id === actor.id);
  const saved = fromUser(self);
  const [draft, setDraft] = useState(saved);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const changes = changedKeys(saved, draft);
  const dirty = changes.length > 0;
  const errors = submitted ? validateProfile(draft) : {};
  const set = (key) => (event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }));
  const fieldId = (key) => `${id}-${key}`;

  const save = async () => {
    setSubmitted(true);
    const found = validateProfile(draft);
    const first = ['name', 'phone'].find((key) => found[key]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    setSaving(true);
    await run(() =>
      updateProfile(
        draft,
        changes.map((key) => FIELD_LABELS[key]),
      ),
    );
    setSaving(false);
    setSubmitted(false);
    notify('Profil disimpan. Aksi tercatat di Audit Log.');
  };

  const reset = () => {
    setDraft(saved);
    setSubmitted(false);
  };

  return (
    <>
      <SettingsCard
        id={`${id}-title`}
        title="Informasi Profil"
        description="Data ini tampil di Audit Log dan menu akun."
      >
        <div className="st-profile-head">
          <Avatar
            person={{ initials: initialsOf(draft.name || self.name), color: draft.color }}
            size={80}
          />
          <div className="st-profile-head__info">
            <div className="st-profile-head__meta">
              <RoleBadge role={self.role} />
              <span>Bergabung sejak {formatDate(self.joinedAt)}</span>
            </div>
            <fieldset className="ad-fieldset">
              <legend className="form-label">Warna avatar</legend>
              <div className="st-swatches">
                {AVATAR_COLOR_OPTIONS.map((option) => (
                  <label key={option.value} className="st-swatch">
                    <input
                      type="radio"
                      name={`${id}-color`}
                      value={option.value}
                      checked={draft.color === option.value}
                      onChange={() => setDraft((prev) => ({ ...prev, color: option.value }))}
                    />
                    <span className="st-swatch__face" style={{ backgroundColor: option.value }}>
                      <CheckIcon size={18} strokeWidth={3} />
                    </span>
                    <span className="visually-hidden">Warna avatar {option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="st-grid">
          <TextField
            id={fieldId('name')}
            label="Nama Lengkap"
            icon={UserIcon}
            autoComplete="name"
            value={draft.name}
            onChange={set('name')}
            error={errors.name}
          />
          <TextField
            id={fieldId('email')}
            label="Email"
            icon={MailIcon}
            required={false}
            hideOptional
            readOnly
            value={self.email}
            help="Hubungi pengelola lain untuk mengubah email."
            trailing={<LockIcon size={18} className="ad-input__lock" aria-hidden="true" />}
          />
          <TextField
            id={fieldId('phone')}
            label="Nomor WhatsApp"
            icon={PhoneIcon}
            prefix="+62"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={draft.phone}
            onChange={set('phone')}
            error={errors.phone}
            help={
              normalizeLocalPhone(draft.phone) !== saved.phone
                ? `Diubah dari ${formatPhone(saved.phone)}.`
                : undefined
            }
          />
          <TextField
            id={fieldId('position')}
            label="Jabatan / Unit Kerja"
            icon={BriefcaseIcon}
            required={false}
            placeholder="Contoh: Staf Pemberdayaan Alumni"
            value={draft.position}
            onChange={set('position')}
          />
          <SelectField
            id={fieldId('region')}
            label="Kota/Kabupaten"
            icon={MapPinIcon}
            required={false}
            placeholder="Pilih kota/kabupaten"
            options={JABAR_REGIONS.map((region) => ({ value: region, label: region }))}
            value={draft.region}
            onChange={set('region')}
          />
        </div>
      </SettingsCard>

      <SaveBar dirty={dirty} saving={saving} onReset={reset} onSave={save} />
    </>
  );
}
