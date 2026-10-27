import { useState } from 'react';
import { PAYMENT_METHODS } from '@/features/providers/providerProfiles';
import { DEFAULT_RADIUS_KM, NOTE_MAX } from '@/features/booking/bookingDraft';
import {
  BanknoteIcon,
  BuildingIcon,
  CheckCircleIcon,
  CreditCardIcon,
  CrosshairIcon,
  HomeIcon,
  InfoIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  SmartphoneIcon,
  WalletIcon,
} from '@/components/ui/icons';
import { StepHeading } from './StepParts';

const ADDRESS_ICONS = { rumah: HomeIcon, kantor: BuildingIcon };
const PAYMENT_ICONS = { transfer: CreditCardIcon, ewallet: SmartphoneIcon, cod: BanknoteIcon };
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
        <rect width="736" height="200" rx="12" fill="#e8f3fa" />
        <g fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round">
          <path d="M0 140 C184 110 368 170 736 120" />
          <path d="M220.8 0 C257.6 80 184 140 235.5 200" />
          <path d="M456.3 0 L515.2 200" />
        </g>
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="#14a3a3"
          fillOpacity="0.1"
          stroke="#0c7272"
          strokeWidth="2.5"
          strokeDasharray="7 7"
        />
        <circle cx={center.x} cy={center.y} r="9" fill="#14a3a3" stroke="#fff" strokeWidth="3" />
        <rect x="177" y="88" width="114" height="24" rx="8" fill="#fff" stroke="#9fdcdc" />
        <text
          x="234"
          y="105"
          textAnchor="middle"
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
          fontSize="13"
          fontWeight="700"
          fill="#0c7272"
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
          fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
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
            <circle cx="12" cy="12" r="6" fill="#14a3a3" />
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
              stroke="#0c7272"
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

/** Langkah 3 — data pemesan, alamat, catatan, info pembayaran. */
export default function StepDetails({ profile, user, draft, update, errors }) {
  const [geoStatus, setGeoStatus] = useState('');
  const addresses = user.addresses ?? [];
  const saved = addresses.find((a) => a.id === draft.addressId);
  const radiusKm = profile.serviceRadiusKm ?? DEFAULT_RADIUS_KM;
  const phoneError = errors['booking-phone'];
  const addressError = errors['booking-address'];

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus(
        'Browser Anda tidak mendukung deteksi lokasi. Silakan isi alamat secara manual.',
      );
      return;
    }
    setGeoStatus('Mendeteksi lokasi Anda…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update((current) => ({
          customAddress: `${current.customAddress ? `${current.customAddress}\n` : ''}Titik lokasi: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
        }));
        setGeoStatus('Titik lokasi ditambahkan. Lengkapi nama jalan dan nomor rumah.');
      },
      () => setGeoStatus('Lokasi tidak dapat diakses. Silakan isi alamat secara manual.'),
      { timeout: 10000 },
    );
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
              Nomor WhatsApp{' '}
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
          Nomor ini dibagikan ke penyedia setelah pesanan diterima.
        </p>
      </section>

      <section className="booking-card" aria-labelledby="s-alamat">
        <h3 id="s-alamat" className="booking-card__title">
          Alamat Layanan
        </h3>
        <fieldset
          className="address-fieldset"
          aria-describedby={addressError ? 'booking-address-error' : undefined}
        >
          <legend className="field-label">
            {addresses.length ? 'Alamat tersimpan' : 'Alamat lokasi layanan'}{' '}
            <span className="field-required" aria-hidden="true">
              *
            </span>
            <span className="visually-hidden">(wajib)</span>
          </legend>
          {addresses.length > 0 && (
            <div className="address-options">
              {addresses.map((address) => {
                const Icon = ADDRESS_ICONS[address.id] ?? MapPinIcon;
                const checked = draft.addressId === address.id;
                return (
                  <label key={address.id} className="address-option">
                    <input
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
                      <span className="address-option__text">{address.text}</span>
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
          )}
          <label className="address-option address-option--other">
            <input
              type="radio"
              name="alamat"
              value="lain"
              checked={draft.addressId === 'lain'}
              onChange={() => update({ addressId: 'lain' })}
              aria-controls="alamat-lain"
            />
            <span className="address-option__add">
              <PlusIcon size={18} strokeWidth={2.5} />
              {addresses.length ? 'Gunakan alamat lain' : 'Isi alamat lokasi layanan'}
            </span>
          </label>
        </fieldset>

        {draft.addressId === 'lain' && (
          <div className="field" id="alamat-lain">
            <label htmlFor="booking-address" className="field-label">
              Alamat lengkap{' '}
              <span className="field-required" aria-hidden="true">
                *
              </span>
              <span className="visually-hidden">(wajib)</span>
            </label>
            <div
              className={`input-shell input-shell--area${addressError ? ' input-shell--invalid' : ''}`}
            >
              <MapPinIcon className="input-shell__icon input-shell__icon--top" />
              <textarea
                id="booking-address"
                rows={3}
                className="input-shell__control"
                placeholder="Contoh: Jl. Cigadung Raya No. 12, Cibeunying Kaler, Bandung"
                value={draft.customAddress}
                onChange={(event) => update({ customAddress: event.target.value })}
                aria-invalid={Boolean(addressError)}
                aria-describedby={addressError ? 'booking-address-error' : undefined}
              />
            </div>
            <button
              type="button"
              className="link-button link-button--flush"
              onClick={detectLocation}
            >
              <CrosshairIcon />
              Gunakan Lokasi Saya
            </button>
            {geoStatus && (
              <p className="field-hint" role="status">
                {geoStatus}
              </p>
            )}
          </div>
        )}
        {addressError && (
          <p id="booking-address-error" className="field-error">
            {addressError}
          </p>
        )}

        {saved?.distanceKm !== undefined && (
          <AreaMap providerName={profile.name.split(' ')[0]} address={saved} radiusKm={radiusKm} />
        )}
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

      <section className="booking-card booking-card--tinted" aria-labelledby="s-bayar">
        <h3 id="s-bayar" className="booking-card__title">
          Pembayaran
        </h3>
        <div className="payment-info">
          <span className="icon-tile icon-tile--primary" aria-hidden="true">
            <WalletIcon size={24} />
          </span>
          <div>
            <p className="payment-info__title">Pembayaran langsung ke penyedia</p>
            <p>
              Pembayaran dilakukan di luar platform setelah layanan disepakati. Penyedia menerima:{' '}
              {profile.paymentMethods.map((key) => PAYMENT_METHODS[key].label).join(', ')}.
            </p>
          </div>
        </div>
        <ul className="payment-chips" aria-label="Metode yang diterima penyedia">
          {profile.paymentMethods.map((key) => {
            const Icon = PAYMENT_ICONS[key];
            return (
              <li key={key}>
                <Icon size={18} />
                {PAYMENT_METHODS[key].label}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
