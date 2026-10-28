import { useId, useState } from 'react';
import partnerAlumniIcon from '@/assets/icons/partner-alumni.svg';
import partnerUptdIcon from '@/assets/icons/partner-uptd.svg';
import {
  ArrowRightIcon,
  BuildingIcon,
  ClockIcon,
  GlobeIcon,
  InfoIcon,
  MailIcon,
  PencilIcon,
  PhoneIcon,
  PlusIcon,
  TypeIcon,
  UsersIcon,
} from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { normalizeLocalPhone } from '@/features/admin/accountForm';
import { ADDRESS_MAX, PLATFORM_DESCRIPTION_MAX, TAGLINE_MAX } from '@/features/admin/settingsData';
import { diffPlatformInfo, validatePlatformInfo } from '@/features/admin/settingsForm';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ReasonDialog } from '../AdminDialogs';
import { TextAreaField, TextField } from '../FormFields';
import PartnerDialog from './PartnerDialog';
import { SaveBar, SettingsCard } from './SettingsParts';

const PARTNER_ICONS = { users: UsersIcon, building: BuildingIcon };
const PARTNER_IMAGES = { users: partnerAlumniIcon, building: partnerUptdIcon };
const FIELD_ORDER = ['name', 'tagline', 'email', 'phone'];

/** Ringkasan perubahan di dialog konfirmasi simpan. */
function ChangeSummary({ changes }) {
  return (
    <div className="st-summary">
      <p className="st-summary__count">{changes.length} perubahan</p>
      <ul>
        {changes.map((change) => (
          <li key={change.key}>
            <span className="st-summary__section">{change.section}</span>
            <span className="st-summary__field">{change.label}:</span>{' '}
            {change.before != null && (
              <>
                <del>
                  <span className="visually-hidden">sebelumnya </span>
                  {change.before || '(kosong)'}
                </del>
                <ArrowRightIcon size={14} aria-hidden="true" />
                <span className="visually-hidden"> menjadi </span>
              </>
            )}
            <ins>{change.after || '(kosong)'}</ins>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Pratinjau footer halaman publik (berubah mengikuti isian). */
function FooterPreview({ info }) {
  const captionId = useId();
  return (
    <figure className="st-preview" aria-labelledby={captionId}>
      <figcaption id={captionId} className="st-preview__caption">
        Pratinjau footer halaman publik
      </figcaption>
      <div className="st-preview__body">
        <div>
          <strong className="st-preview__name">{info.name || 'Nama platform'}</strong>
          <p className="st-preview__tagline">{info.tagline || 'Tagline platform'}</p>
        </div>
        <div>
          <p className="st-preview__heading">Bekerja sama dengan</p>
          <ul className="st-preview__partners">
            {info.partners.map((partner) => (
              <li key={partner.id}>
                <img src={PARTNER_IMAGES[partner.icon]} alt="" width="18" height="18" />
                {partner.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}

/** Pengaturan · Informasi Platform (tampil di halaman publik). */
export default function PlatformInfoSettings() {
  useDocumentTitle('Pengaturan · Informasi Platform');
  const id = useId();
  const { platformInfo, updatePlatformInfo, run, notify } = useAdmin();
  const [draft, setDraft] = useState(platformInfo);
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [partnerDialog, setPartnerDialog] = useState({ open: false, partner: null });

  const changes = diffPlatformInfo(platformInfo, draft);
  const dirty = changes.length > 0;
  const errors = submitted ? validatePlatformInfo(draft) : {};
  const fieldId = (key) => `${id}-${key}`;
  const set = (key) => (event) => setDraft((prev) => ({ ...prev, [key]: event.target.value }));
  const changedFrom = (key) => {
    const change = changes.find((c) => c.key === key);
    return change ? `Diubah dari “${change.before}”.` : undefined;
  };

  const requestSave = () => {
    setSubmitted(true);
    const found = validatePlatformInfo(draft);
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) {
      document.getElementById(fieldId(first))?.focus();
      return;
    }
    setConfirming(true);
  };

  const save = async (reason) => {
    await run(() =>
      updatePlatformInfo({ ...draft, phone: normalizeLocalPhone(draft.phone) }, changes, reason),
    );
    setConfirming(false);
    setSubmitted(false);
    setDraft((prev) => ({ ...prev, phone: normalizeLocalPhone(prev.phone) }));
    notify('Informasi platform disimpan. Aksi tercatat di Audit Log.');
  };

  const savePartner = (values) => {
    const editing = partnerDialog.partner;
    setDraft((prev) => ({
      ...prev,
      partners: editing
        ? prev.partners.map((p) => (p.id === editing.id ? { ...p, ...values } : p))
        : [...prev.partners, { id: `p-${Date.now()}`, ...values }],
    }));
    setPartnerDialog({ open: false, partner: null });
  };

  return (
    <>
      <p className="st-note st-note--info">
        <InfoIcon size={18} />
        Informasi di halaman ini tampil di halaman publik (footer dan halaman Tentang). Setiap
        perubahan tercatat di Audit Log.
      </p>

      <SettingsCard
        id={`${id}-identity`}
        title="Identitas Platform"
        description="Nama dan deskripsi yang dilihat pengunjung."
      >
        <div className="st-stack">
          <TextField
            id={fieldId('name')}
            label="Nama Platform"
            icon={GlobeIcon}
            value={draft.name}
            onChange={set('name')}
            error={errors.name}
            help={changedFrom('name')}
          />
          <TextField
            id={fieldId('tagline')}
            label="Tagline"
            icon={TypeIcon}
            maxLength={TAGLINE_MAX}
            value={draft.tagline}
            onChange={set('tagline')}
            error={errors.tagline}
            help={`${draft.tagline.length}/${TAGLINE_MAX} karakter`}
          />
          <TextAreaField
            id={fieldId('description')}
            label="Deskripsi singkat"
            maxLength={PLATFORM_DESCRIPTION_MAX}
            value={draft.description}
            onChange={set('description')}
            help="Tampil di halaman Tentang."
          />
          <FooterPreview info={draft} />
        </div>
      </SettingsCard>

      <SettingsCard
        id={`${id}-contact`}
        title="Kontak Bantuan"
        description="Saluran yang dihubungi pengguna saat butuh bantuan."
      >
        <div className="st-grid">
          <TextField
            id={fieldId('email')}
            label="Email Bantuan"
            icon={MailIcon}
            type="email"
            value={draft.email}
            onChange={set('email')}
            error={errors.email}
            help={changedFrom('email')}
          />
          <TextField
            id={fieldId('phone')}
            label="Nomor WhatsApp Bantuan"
            icon={PhoneIcon}
            prefix="+62"
            type="tel"
            inputMode="numeric"
            value={draft.phone}
            onChange={set('phone')}
            error={errors.phone}
          />
          <TextField
            id={fieldId('hours')}
            label="Jam Layanan"
            icon={ClockIcon}
            required={false}
            value={draft.hours}
            onChange={set('hours')}
            help={changedFrom('hours')}
          />
        </div>
        <TextAreaField
          id={fieldId('address')}
          label="Alamat Kantor"
          short
          maxLength={ADDRESS_MAX}
          value={draft.address}
          onChange={set('address')}
        />
      </SettingsCard>

      <SettingsCard
        id={`${id}-partners`}
        title="Mitra Kolaborasi"
        description="Tampil di bagian “Bekerja sama dengan” pada footer."
      >
        <ul className="st-partners">
          {draft.partners.map((partner) => {
            const Icon = PARTNER_ICONS[partner.icon] ?? BuildingIcon;
            return (
              <li key={partner.id} className="st-partner">
                <span className="st-partner__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                <span className="st-partner__text">
                  <strong>{partner.name}</strong>
                  {partner.description && <span>{partner.description}</span>}
                </span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  aria-label={`Ubah mitra ${partner.name}`}
                  onClick={() => setPartnerDialog({ open: true, partner })}
                >
                  <PencilIcon size={16} />
                  Ubah
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="btn btn--outline btn--md st-add"
          onClick={() => setPartnerDialog({ open: true, partner: null })}
        >
          <PlusIcon size={18} />
          Tambah Mitra
        </button>
      </SettingsCard>

      <SaveBar
        dirty={dirty}
        saving={false}
        onReset={() => {
          setDraft(platformInfo);
          setSubmitted(false);
        }}
        onSave={requestSave}
      />

      <PartnerDialog
        open={partnerDialog.open}
        partner={partnerDialog.partner}
        partners={draft.partners}
        onClose={() => setPartnerDialog({ open: false, partner: null })}
        onSave={savePartner}
      />

      <ReasonDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        tone="info"
        icon={GlobeIcon}
        title="Simpan perubahan informasi platform?"
        description="Perubahan langsung tampil di halaman publik."
        summary={<ChangeSummary changes={changes} />}
        label="Alasan perubahan"
        confirmLabel="Simpan"
        onConfirm={save}
      />
    </>
  );
}
