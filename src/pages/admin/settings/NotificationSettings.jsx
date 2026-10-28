import { useId } from 'react';
import { InfoIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { useAdmin } from '@/context/useAdmin';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { SettingsCard } from './SettingsParts';

const CHANNELS = [
  { key: 'app', label: 'In-App' },
  { key: 'email', label: 'Email' },
];

function Switch({ checked, label, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="st-switch"
      onClick={() => onChange(!checked)}
    >
      <span className="st-switch__thumb" aria-hidden="true" />
    </button>
  );
}

/** Pengaturan · Notifikasi: preferensi per jenis & kanal (tersimpan langsung). */
export default function NotificationSettings() {
  useDocumentTitle('Pengaturan · Notifikasi');
  const id = useId();
  const { notificationPrefs, setNotificationPref, notify } = useAdmin();

  const toggle = (pref, channel, value) => {
    setNotificationPref(pref.id, channel.key, value);
    notify(
      `Notifikasi ${channel.label} untuk "${pref.label}" ${value ? 'diaktifkan' : 'dimatikan'}.`,
    );
  };

  return (
    <SettingsCard
      id={`${id}-title`}
      title="Preferensi Notifikasi"
      description="Pilih pemberitahuan yang ingin Anda terima. Perubahan tersimpan otomatis."
    >
      <div className="dash-table-wrap st-notif-wrap">
        <table className="st-notif">
          <caption className="visually-hidden">
            Preferensi notifikasi per jenis dan kanal pengiriman
          </caption>
          <thead>
            <tr>
              <th scope="col">Jenis notifikasi</th>
              {CHANNELS.map((channel) => (
                <th key={channel.key} scope="col" className="st-notif__channel">
                  {channel.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {notificationPrefs.map((pref) => (
              <tr key={pref.id}>
                <th scope="row">
                  <strong>{pref.label}</strong>
                  <span>{pref.description}</span>
                </th>
                {CHANNELS.map((channel) => (
                  <td key={channel.key} className="st-notif__channel">
                    {pref[channel.key] === null ? (
                      <span className="st-notif__na">
                        <span aria-hidden="true">— </span>Hanya email
                      </span>
                    ) : (
                      <Switch
                        checked={pref[channel.key]}
                        label={`${channel.label}: ${pref.label}`}
                        onChange={(value) => toggle(pref, channel, value)}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="st-note">
        <ShieldCheckIcon size={18} />
        Notifikasi keamanan akun selalu dikirim dan tidak dapat dimatikan.
      </p>
      <p className="ad-hint st-note-hint">
        <InfoIcon size={16} />
        Email dikirim ke alamat akun Anda.
      </p>
    </SettingsCard>
  );
}
