import { useId, useState } from 'react';
import { PanelHead } from '@/components/dashboard/DashboardWidgets';
import { COMMUNICATION_PREF_OPTIONS } from '@/features/dashboard/providerDashboardAdapters';

const DAYS = [
  { day: 1, label: 'Senin' },
  { day: 2, label: 'Selasa' },
  { day: 3, label: 'Rabu' },
  { day: 4, label: 'Kamis' },
  { day: 5, label: 'Jumat' },
  { day: 6, label: 'Sabtu' },
  { day: 0, label: 'Minggu' },
];

function buildDayRows(slots = []) {
  return DAYS.map(({ day, label }) => {
    const match = slots.find((s) => s.day_of_week === day);
    return {
      day,
      label,
      enabled: Boolean(match),
      start_time: match?.start_time ?? '08:00',
      end_time: match?.end_time ?? '17:00',
    };
  });
}

/** Panel edit profil penyedia (`PUT /provider/profile`) dan jadwal mingguan (`PUT /provider/availability`). */
export default function ProviderProfileSchedulePanel({
  profile,
  availability,
  onSaveProfile,
  onSaveAvailability,
}) {
  const id = useId();
  const [form, setForm] = useState(() => ({
    display_name: profile?.display_name ?? profile?.name ?? '',
    phone: profile?.phone ?? '',
    city: profile?.city ?? '',
    district: profile?.district ?? '',
    address_detail: profile?.address_detail ?? '',
    service_radius_km: profile?.service_radius_km ? String(profile.service_radius_km) : '10',
    disability_type: profile?.disability_type ?? '',
    bio: profile?.bio ?? '',
    communication_prefs: profile?.communication_prefs ?? ['chat'],
  }));
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);

  const [days, setDays] = useState(() => buildDayRows(availability));
  const [scheduleError, setScheduleError] = useState('');
  const [scheduleBusy, setScheduleBusy] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const togglePref = (pref) => {
    setForm((prev) => {
      const exists = prev.communication_prefs.includes(pref);
      return {
        ...prev,
        communication_prefs: exists
          ? prev.communication_prefs.filter((item) => item !== pref)
          : [...prev.communication_prefs, pref],
      };
    });
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    const displayName = form.display_name.trim();
    const city = form.city.trim();
    const phone = form.phone.trim();
    if (displayName.length < 2) {
      setProfileError('Nama tampil minimal 2 karakter.');
      return;
    }
    if (city.length < 2) {
      setProfileError('Kota/Kabupaten minimal 2 karakter.');
      return;
    }
    if (phone && !/^\+62\d{8,13}$/.test(phone)) {
      setProfileError('Nomor telepon harus diawali +62, contoh +6281234567890.');
      return;
    }
    const radius = form.service_radius_km.trim() ? Number(form.service_radius_km) : null;
    if (radius !== null && (!Number.isInteger(radius) || radius < 1 || radius > 500)) {
      setProfileError('Radius layanan harus bilangan bulat antara 1–500 km.');
      return;
    }

    setProfileError('');
    setProfileBusy(true);
    try {
      await onSaveProfile({
        display_name: displayName,
        ...(phone ? { phone } : {}),
        city,
        district: form.district.trim() || null,
        ...(form.address_detail.trim() ? { address_detail: form.address_detail.trim() } : {}),
        service_radius_km: radius,
        disability_type: form.disability_type.trim() || null,
        bio: form.bio.trim() || null,
        communication_prefs: form.communication_prefs,
      });
    } catch (err) {
      setProfileError(err?.message || 'Gagal menyimpan profil penyedia.');
    } finally {
      setProfileBusy(false);
    }
  };

  const updateDay = (dayNumber, patch) => {
    setDays((prev) => prev.map((row) => (row.day === dayNumber ? { ...row, ...patch } : row)));
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    const activeSlots = days.filter((row) => row.enabled);
    for (const row of activeSlots) {
      if (row.end_time <= row.start_time) {
        setScheduleError(`Jam selesai hari ${row.label} harus lebih besar dari jam mulai.`);
        return;
      }
    }
    setScheduleError('');
    setScheduleBusy(true);
    try {
      await onSaveAvailability(
        activeSlots.map((row) => ({
          day_of_week: row.day,
          start_time: row.start_time,
          end_time: row.end_time,
        })),
      );
    } catch (err) {
      setScheduleError(err?.message || 'Gagal menyimpan jadwal operasional.');
    } finally {
      setScheduleBusy(false);
    }
  };

  return (
    <div id="pengaturan" className="provider-grid provider-grid--stretch">
      <section className="dash-card dash-panel" aria-labelledby="profil-form-title">
        <PanelHead id="profil-form-title" title="Pengaturan Profil Penyedia" />
        <form className="provider-settings-form" noValidate onSubmit={handleProfileSubmit}>
          <div className="provider-form-grid">
            <div className="form-field">
              <label htmlFor={`${id}-name`} className="form-label">
                Nama tampil *
              </label>
              <input
                id={`${id}-name`}
                className="form-input"
                type="text"
                required
                value={form.display_name}
                disabled={profileBusy}
                onChange={(event) => setField('display_name', event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`${id}-phone`} className="form-label">
                Nomor telepon (+62)
              </label>
              <input
                id={`${id}-phone`}
                className="form-input"
                type="tel"
                placeholder="+6281234567890"
                value={form.phone}
                disabled={profileBusy}
                onChange={(event) => setField('phone', event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`${id}-city`} className="form-label">
                Kota / Kabupaten *
              </label>
              <input
                id={`${id}-city`}
                className="form-input"
                type="text"
                required
                value={form.city}
                disabled={profileBusy}
                onChange={(event) => setField('city', event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`${id}-district`} className="form-label">
                Kecamatan
              </label>
              <input
                id={`${id}-district`}
                className="form-input"
                type="text"
                value={form.district}
                disabled={profileBusy}
                onChange={(event) => setField('district', event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`${id}-radius`} className="form-label">
                Radius layanan (km)
              </label>
              <input
                id={`${id}-radius`}
                className="form-input"
                type="number"
                min="1"
                max="500"
                value={form.service_radius_km}
                disabled={profileBusy}
                onChange={(event) => setField('service_radius_km', event.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor={`${id}-disability`} className="form-label">
                Catatan aksesibilitas (opsional)
              </label>
              <input
                id={`${id}-disability`}
                className="form-input"
                type="text"
                maxLength={50}
                placeholder="Mis. tunarungu / komunikasi via chat"
                value={form.disability_type}
                disabled={profileBusy}
                onChange={(event) => setField('disability_type', event.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-address`} className="form-label">
              Alamat lengkap (privat, tidak tampil publik)
            </label>
            <input
              id={`${id}-address`}
              className="form-input"
              type="text"
              maxLength={500}
              value={form.address_detail}
              disabled={profileBusy}
              onChange={(event) => setField('address_detail', event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-bio`} className="form-label">
              Bio singkat
            </label>
            <textarea
              id={`${id}-bio`}
              className="form-textarea"
              rows={3}
              maxLength={500}
              value={form.bio}
              disabled={profileBusy}
              onChange={(event) => setField('bio', event.target.value)}
            />
          </div>

          <fieldset className="provider-prefs">
            <legend className="form-label">Preferensi komunikasi</legend>
            <div className="provider-prefs__list">
              {COMMUNICATION_PREF_OPTIONS.map((opt) => (
                <label key={opt.value} className="provider-checkbox">
                  <input
                    type="checkbox"
                    checked={form.communication_prefs.includes(opt.value)}
                    disabled={profileBusy}
                    onChange={() => togglePref(opt.value)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {profileError && (
            <p className="form-field__error" role="alert">
              {profileError}
            </p>
          )}

          <div>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={profileBusy}>
              {profileBusy ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </section>

      <section className="dash-card dash-panel" aria-labelledby="jadwal-form-title">
        <PanelHead id="jadwal-form-title" title="Atur Jadwal Operasional" />
        <form className="provider-settings-form" noValidate onSubmit={handleScheduleSubmit}>
          <ul className="provider-availability">
            {days.map((row) => (
              <li key={row.day} className="provider-availability__row">
                <label className="provider-checkbox provider-availability__day">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    disabled={scheduleBusy}
                    onChange={(event) => updateDay(row.day, { enabled: event.target.checked })}
                  />
                  <span>{row.label}</span>
                </label>
                <div className="provider-availability__times">
                  <input
                    type="time"
                    className="form-input"
                    aria-label={`Jam mulai ${row.label}`}
                    value={row.start_time}
                    disabled={!row.enabled || scheduleBusy}
                    onChange={(event) => updateDay(row.day, { start_time: event.target.value })}
                  />
                  <span aria-hidden="true">–</span>
                  <input
                    type="time"
                    className="form-input"
                    aria-label={`Jam selesai ${row.label}`}
                    value={row.end_time}
                    disabled={!row.enabled || scheduleBusy}
                    onChange={(event) => updateDay(row.day, { end_time: event.target.value })}
                  />
                </div>
              </li>
            ))}
          </ul>

          {scheduleError && (
            <p className="form-field__error" role="alert">
              {scheduleError}
            </p>
          )}

          <div>
            <button type="submit" className="dash-btn dash-btn--primary" disabled={scheduleBusy}>
              {scheduleBusy ? 'Menyimpan...' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
