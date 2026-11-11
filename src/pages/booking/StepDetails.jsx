import { useState } from 'react';
import { DEFAULT_RADIUS_KM, NOTE_MAX } from '@/features/booking/bookingDraft';
import { addAddress, addressLine, addressesFor, distanceKm } from '@/features/booking/addressBook';
import {
  BuildingIcon,
  CheckCircleIcon,
  HomeIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
} from '@/components/ui/icons';
import AddressDialog from './AddressDialog';
import { StepHeading } from './StepParts';

/** Ikon per label alamat (alamat contoh memakai id rumah/kantor). */
const ADDRESS_ICONS = {
  rumah: HomeIcon,
  Rumah: HomeIcon,
  kantor: BuildingIcon,
  Kantor: BuildingIcon,
};
const iconOf = (address) => ADDRESS_ICONS[address.label] ?? ADDRESS_ICONS[address.id] ?? MapPinIcon;
const PIN_PATH = 'M0 0 C-2 -7 -14 -14 -14 -26 A14 14 0 1 1 14 -26 C14 -14 2 -7 0 0 Z';

/** Peta mini: titik penyedia + radius layanan, dan alamat terpilih (ilustrasi, bukan peta asli). */
function AreaMap({ providerName, address, radiusKm }) {
  const center = { x: 309, y: 100 };
  const radius = 74;
  const offset = (Math.min(address.distanceKm, radiusKm * 1.6) / radiusKm) * radius;
  const pin = { x: center.x + offset * 0.83, y: center.y + offset * 0.56 };
  const inside = address.distanceKm <= radiusKm;
  const label = `${address.label} (Anda)`;
  const labelWidth = label.length * 8 + 24;

  return (
    <>
      <svg
        className="area-map"
        viewBox="0 0 736 200"
        role="img"
        aria-label={`Peta mini: alamat ${address.label} Anda berada ${inside ? 'di dalam' : 'di luar'} radius layanan penyedia, sekitar ${address.distanceKm} km.`}
      >
        <rect width="736" height="200" rx="12" fill="#eaeff5" />
        <g fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round">
          <path d="M0 140 C184 110 368 170 736 120" />
          <path d="M220.8 0 C257.6 80 184 140 235.5 200" />
          <path d="M456.3 0 L515.2 200" />
        </g>
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="#1a9a94"
          fillOpacity="0.1"
          stroke="#0b6b67"
          strokeWidth="2.5"
          strokeDasharray="7 7"
        />
        <circle cx={center.x} cy={center.y} r="9" fill="#1a9a94" stroke="#fff" strokeWidth="3" />
        <rect x="177" y="88" width="114" height="24" rx="8" fill="#fff" stroke="#9fd2cd" />
        <text
          x="234"
          y="105"
          textAnchor="middle"
          fontFamily="Atkinson Hyperlegible Next, system-ui, sans-serif"
          fontSize="13"
          fontWeight="700"
          fill="#0b6b67"
        >
          {providerName} (Penyedia)
        </text>
        <g transform={`translate(${pin.x} ${pin.y})`}>
          <path d={PIN_PATH} fill="#0b3c6e" stroke="#fff" strokeWidth="3" />
          <circle cx="0" cy="-26" r="5" fill="#fff" />
        </g>
        <rect x={pin.x + 16} y={pin.y - 30} width={labelWidth} height="26" rx="9" fill="#0b3c6e" />
        <text
          x={pin.x + 16 + labelWidth / 2}
          y={pin.y - 12}
          textAnchor="middle"
          fontFamily="Atkinson Hyperlegible Next, system-ui, sans-serif"
          fontSize="14"
          fontWeight="700"
          fill="#fff"
        >
          {label}
        </text>
      </svg>
      <p className="area-map__legend">
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 22 C11 19 5 15 5 10 A7 7 0 1 1 19 10 C19 15 13 19 12 22 Z"
              fill="#0b3c6e"
            />
          </svg>
          Alamat Anda
        </span>
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="6" fill="#1a9a94" />
          </svg>
          Penyedia
        </span>
        <span>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="#0b6b67"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
          </svg>
          Area layanan penyedia
        </span>
      </p>
      <p className={`area-status${inside ? '' : ' area-status--outside'}`} role="status">
        <MapPinIcon size={18} strokeWidth={2.25} />
        {inside
          ? `Dalam area layanan penyedia (±${address.distanceKm} km)`
          : `Di luar area layanan penyedia (±${address.distanceKm} km). Penyedia akan mengonfirmasi apakah bisa melayani.`}
      </p>
    </>
  );
}

/** Langkah 3 — data pemesan, alamat layanan (pilih / tambah lewat pop-up peta), catatan. */
export default function StepDetails({ profile, user, draft, update, errors }) {
  const [adding, setAdding] = useState(false);
  const [, setVersion] = useState(0);
  const addresses = addressesFor(user);
  const saved = addresses.find((a) => a.id === draft.addressId);
  const radiusKm = profile.serviceRadiusKm ?? DEFAULT_RADIUS_KM;
  const phoneError = errors['booking-phone'];
  const addressError = errors['booking-address'];
  const providerPoint = { lat: profile.lat, lng: profile.lng };
  const savedDistance = saved ? (distanceKm(providerPoint, saved) ?? saved.distanceKm) : undefined;

  const saveAddress = (address) => {
    const entry = addAddress(user, address);
    setAdding(false);
    setVersion((n) => n + 1);
    update({ addressId: entry.id });
    // Kembalikan fokus ke alamat yang baru dipilih.
    requestAnimationFrame(() => document.getElementById(`alamat-${entry.id}`)?.focus());
  };

  return (
    <>
      <StepHeading
        step={3}
        title="Detail Pesanan"
        description="Pastikan alamat dan data kontak sudah benar."
      />

      <section className="booking-card" aria-labelledby="s-pemesan">
        <h3 id="s-pemesan" className="booking-card__title">
          Data Pemesan
        </h3>
        <div className="customer-box">
          <span className="booking-avatar" style={{ '--avatar-size': '56px' }} aria-hidden="true">
            {user.initials}
          </span>
          <div>
            <p className="customer-box__name">{user.name}</p>
            <p className="customer-box__contacts">
              {user.phone && (
                <span>
                  <PhoneIcon size={18} />
                  <span className="visually-hidden">Telepon </span>
                  {user.phone}
                </span>
              )}
              {user.email && (
                <span>
                  <MailIcon size={18} />
                  <span className="visually-hidden">Email </span>
                  {user.email}
                </span>
              )}
            </p>
          </div>
        </div>
        {!user.phone && (
          <div className="field">
            <label htmlFor="booking-phone" className="field-label">
              Nomor HP{' '}
              <span className="field-required" aria-hidden="true">
                *
              </span>
              <span className="visually-hidden">(wajib)</span>
            </label>
            <div className={`input-shell${phoneError ? ' input-shell--invalid' : ''}`}>
              <span className="input-shell__prefix" aria-hidden="true">
                +62
              </span>
              <input
                id="booking-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                className="input-shell__control"
                placeholder="81234567890"
                value={draft.phone}
                onChange={(event) => update({ phone: event.target.value })}
                aria-invalid={Boolean(phoneError)}
                aria-describedby={phoneError ? 'booking-phone-error' : undefined}
              />
            </div>
            {phoneError && (
              <p id="booking-phone-error" className="field-error">
                {phoneError}
              </p>
            )}
          </div>
        )}
        <p className="field-hint field-hint--icon">
          <InfoIcon size={18} />
          Komunikasi dengan penyedia lewat fitur Chat di aplikasi. Nomor HP hanya dipakai bila
          darurat.
        </p>
      </section>

      <section className="booking-card" aria-labelledby="s-alamat">
        <div className="booking-card__head">
          <h3 id="s-alamat" className="booking-card__title">
            Alamat Layanan
          </h3>
          {addresses.length > 0 && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setAdding(true)}
            >
              <PlusIcon size={18} strokeWidth={2.5} />
              Tambah alamat
            </button>
          )}
        </div>
        {addresses.length > 0 ? (
          <fieldset
            className="address-fieldset"
            aria-describedby={addressError ? 'booking-address-error' : undefined}
          >
            <legend className="field-label">
              Pilih alamat{' '}
              <span className="field-required" aria-hidden="true">
                *
              </span>
              <span className="visually-hidden">(wajib)</span>
            </legend>
            <div className="address-options" id="booking-address" tabIndex={-1}>
              {addresses.map((address) => {
                const Icon = iconOf(address);
                const checked = draft.addressId === address.id;
                return (
                  <label key={address.id} className="address-option">
                    <input
                      id={`alamat-${address.id}`}
                      type="radio"
                      name="alamat"
                      value={address.id}
                      checked={checked}
                      onChange={() => update({ addressId: address.id })}
                    />
                    <span className="address-option__body">
                      <span className="address-option__head">
                        <Icon size={18} />
                        <strong>{address.label}</strong>
                        {address.primary && <span className="address-badge">Utama</span>}
                      </span>
                      <span className="address-option__text">{addressLine(address)}</span>
                      {checked && (
                        <span className="address-option__chosen">
                          <CheckCircleIcon size={16} strokeWidth={2.25} />
                          Dipilih
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : (
          <div className="address-empty">
            <p>
              Belum ada alamat tersimpan. Tambahkan alamat lokasi layanan dan pilih titiknya di
              peta.
            </p>
            <button
              id="booking-address"
              type="button"
              className="address-empty__add"
              onClick={() => setAdding(true)}
              aria-describedby={addressError ? 'booking-address-error' : undefined}
            >
              <span className="address-empty__plus" aria-hidden="true">
                <PlusIcon size={22} strokeWidth={2.5} />
              </span>
              Tambah alamat
            </button>
          </div>
        )}
        {addressError && (
          <p id="booking-address-error" className="field-error">
            {addressError}
          </p>
        )}

        {saved && savedDistance != null && (
          <AreaMap
            providerName={profile.name.split(' ')[0]}
            address={{ ...saved, distanceKm: savedDistance }}
            radiusKm={radiusKm}
          />
        )}
        <AddressDialog
          open={adding}
          initialCenter={saved ?? providerPoint}
          onSave={saveAddress}
          onClose={() => setAdding(false)}
        />
      </section>

      <section className="booking-card" aria-labelledby="s-catatan">
        <h3 id="s-catatan" className="booking-card__title">
          Catatan untuk Penyedia <span className="booking-card__optional">(Opsional)</span>
        </h3>
        <div className="field">
          <label htmlFor="catatan" className="field-label">
            Catatan untuk penyedia
          </label>
          <div className="input-shell input-shell--area">
            <textarea
              id="catatan"
              rows={3}
              maxLength={NOTE_MAX}
              className="input-shell__control"
              placeholder="Contoh: fokus bersihkan dapur dan kamar mandi, ada kucing di rumah."
              value={draft.note}
              onChange={(event) => update({ note: event.target.value })}
              aria-describedby="catatan-count"
            />
          </div>
          <p id="catatan-count" className="field-count">
            {draft.note.length}/{NOTE_MAX} karakter
          </p>
        </div>
      </section>
    </>
  );
}
