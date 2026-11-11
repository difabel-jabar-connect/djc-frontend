import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Dialog from '@/components/ui/Dialog';
import {
  ADDRESS_DETAIL_MAX,
  ADDRESS_LABELS,
  ADDRESS_TEXT_MAX,
} from '@/features/booking/addressBook';
import { JABAR_MAX_BOUNDS } from '@/features/map/jabarGeo';
import {
  BuildingIcon,
  CrosshairIcon,
  HomeIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon,
  XIcon,
} from '@/components/ui/icons';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const NOMINATIM = 'https://nominatim.openstreetmap.org';
/** Pusat awal bila tidak ada titik lain: Kota Bandung. */
const BANDUNG = { lat: -6.9175, lng: 107.6191 };
const LABEL_ICONS = { Rumah: HomeIcon, Kantor: BuildingIcon, Lainnya: MapPinIcon };

/** Alamat dari hasil Nominatim (jsonv2) → { text, area } berbahasa Indonesia. */
function fromNominatim(result) {
  const a = result?.address ?? {};
  const street = [a.road, a.house_number].filter(Boolean).join(' No. ');
  const parts = [
    street,
    a.neighbourhood ?? a.hamlet,
    a.village ?? a.suburb,
    a.city_district ?? a.district,
    a.city ?? a.town ?? a.county ?? a.regency,
    a.postcode,
  ].filter(Boolean);
  const unique = parts.filter((part, index) => parts.indexOf(part) === index);
  return {
    text: unique.join(', ') || result?.display_name || '',
    area: a.city_district ?? a.district ?? a.city ?? a.town ?? a.county ?? '',
  };
}

async function reverseGeocode({ lat, lng }, signal) {
  const url = `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=id&lat=${lat}&lon=${lng}`;
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('reverse geocode gagal');
  return fromNominatim(await response.json());
}

async function searchPlaces(query, signal) {
  const [[south, west], [north, east]] = JABAR_MAX_BOUNDS;
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=id&accept-language=id&bounded=1&viewbox=${west},${north},${east},${south}&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('pencarian gagal');
  const results = await response.json();
  return (Array.isArray(results) ? results : []).map((item) => ({
    id: item.place_id,
    name: item.display_name,
    lat: Number(item.lat),
    lng: Number(item.lon),
  }));
}

/**
 * Peta pilih titik ala aplikasi belanja: pin tetap di tengah, peta yang digeser. Setiap kali
 * peta berhenti digeser, `onMove({ lat, lng })` dipanggil dengan titik di bawah pin.
 */
function PinMap({ center, onMove, mapRef }) {
  const containerRef = useRef(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    const map = L.map(containerRef.current, {
      zoomControl: false,
      minZoom: 8,
      maxZoom: 19,
      maxBounds: JABAR_MAX_BOUNDS,
      maxBoundsViscosity: 0.9,
      attributionControl: true,
    }).setView([center.lat, center.lng], 16);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
    map.attributionControl.setPrefix(false);
    map.on('moveend', () => {
      const point = map.getCenter();
      onMoveRef.current({ lat: point.lat, lng: point.lng });
    });
    mapRef.current = map;
    // Ukuran peta baru benar setelah dialog selesai tampil.
    const frame = requestAnimationFrame(() => map.invalidateSize());
    return () => {
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
    };
    // Peta dibuat sekali saat dialog dibuka; pindah titik lewat mapRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const zoomBy = (delta) => mapRef.current?.setZoom(mapRef.current.getZoom() + delta);

  return (
    <div className="pin-map">
      <div
        ref={containerRef}
        className="pin-map__canvas"
        role="application"
        aria-label="Peta titik lokasi. Geser peta agar pin tepat di lokasi Anda; gunakan tombol panah untuk menggeser dan tombol plus/minus untuk memperbesar."
      />
      <span className="pin-map__pin" aria-hidden="true">
        <svg width="40" height="52" viewBox="-20 -50 40 52">
          <ellipse cx="0" cy="0" rx="7" ry="2.5" fill="rgb(7 42 77 / 30%)" />
          <path
            d="M0 0 C-2 -8 -16 -16 -16 -30 A16 16 0 1 1 16 -30 C16 -16 2 -8 0 0 Z"
            fill="#0b3c6e"
            stroke="#fff"
            strokeWidth="3"
          />
          <circle cx="0" cy="-30" r="6" fill="#fff" />
        </svg>
      </span>
      <div className="pin-map__zoom">
        <button
          type="button"
          className="pin-map__btn"
          aria-label="Perbesar peta"
          onClick={() => zoomBy(1)}
        >
          <PlusIcon size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="pin-map__btn"
          aria-label="Perkecil peta"
          onClick={() => zoomBy(-1)}
        >
          <MinusIcon size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function AddressForm({ initialCenter, onSave, onClose }) {
  const id = useId();
  const mapRef = useRef(null);
  const textEdited = useRef(false);
  const lookup = useRef(null);
  const [point, setPoint] = useState(initialCenter);
  const [label, setLabel] = useState('Rumah');
  const [text, setText] = useState('');
  const [area, setArea] = useState('');
  const [detail, setDetail] = useState('');
  const [primary, setPrimary] = useState(false);
  const [geo, setGeo] = useState({ state: 'idle', message: '' });
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ state: 'idle', results: [] });
  const [error, setError] = useState('');

  // Titik berubah → isi alamat otomatis dari peta (selama belum diketik sendiri).
  useEffect(() => {
    lookup.current?.abort();
    const controller = new AbortController();
    lookup.current = controller;
    const timer = setTimeout(() => {
      setGeo({ state: 'loading', message: 'Mencari alamat di titik ini…' });
      reverseGeocode(point, controller.signal).then(
        (found) => {
          setArea(found.area);
          if (!textEdited.current) setText(found.text.slice(0, ADDRESS_TEXT_MAX));
          setGeo({ state: 'idle', message: '' });
        },
        (err) => {
          if (err?.name === 'AbortError') return;
          setGeo({
            state: 'error',
            message: 'Alamat untuk titik ini tidak ditemukan. Silakan ketik alamat lengkap.',
          });
        },
      );
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [point]);

  const moveTo = (target) => {
    mapRef.current?.setView([target.lat, target.lng], 17);
    setPoint(target);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeo({ state: 'error', message: 'Browser Anda tidak mendukung deteksi lokasi.' });
      return;
    }
    setGeo({ state: 'loading', message: 'Mendeteksi lokasi Anda…' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        textEdited.current = false;
        moveTo({ lat: coords.latitude, lng: coords.longitude });
      },
      () =>
        setGeo({
          state: 'error',
          message: 'Lokasi tidak dapat diakses. Geser peta atau cari alamat secara manual.',
        }),
      { timeout: 10000 },
    );
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 3) {
      setSearch({ state: 'error', results: [], message: 'Ketik minimal 3 huruf.' });
      return;
    }
    setSearch({ state: 'loading', results: [] });
    try {
      const results = await searchPlaces(q);
      setSearch({
        state: results.length ? 'done' : 'error',
        results,
        message: results.length ? '' : 'Lokasi tidak ditemukan di Jawa Barat. Coba kata lain.',
      });
    } catch {
      setSearch({ state: 'error', results: [], message: 'Pencarian gagal. Coba lagi.' });
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Dialog dirender lewat portal, tapi event React tetap merambat ke <form> pesanan.
    event.stopPropagation();
    const value = text.trim();
    if (value.length < 10) {
      setError('Isi alamat lengkap (nama jalan, nomor, kelurahan/kecamatan), minimal 10 huruf.');
      document.getElementById(`${id}-text`)?.focus();
      return;
    }
    onSave({
      label,
      text: value,
      detail: detail.trim(),
      area: area.trim(),
      lat: Math.round(point.lat * 1e6) / 1e6,
      lng: Math.round(point.lng * 1e6) / 1e6,
      primary,
    });
  };

  return (
    <form className="dialog__form address-form" noValidate onSubmit={handleSubmit}>
      <div className="dialog__head">
        <div className="dialog__head-text">
          <h2 id="tambah-alamat-title" className="dialog__title">
            Tambah Alamat
          </h2>
          <p className="dialog__desc">Geser peta sampai pin tepat di lokasi layanan.</p>
        </div>
        <button type="button" className="dialog__close" aria-label="Tutup" onClick={onClose}>
          <XIcon size={22} strokeWidth={2} />
        </button>
      </div>

      <div className="address-search">
        <label htmlFor={`${id}-search`} className="visually-hidden">
          Cari jalan, gedung, atau daerah
        </label>
        <div className="input-shell">
          <SearchIcon className="input-shell__icon" />
          <input
            id={`${id}-search`}
            type="search"
            className="input-shell__control"
            placeholder="Cari jalan, gedung, atau daerah"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                runSearch();
              }
            }}
          />
        </div>
        <button type="button" className="btn btn--outline" onClick={runSearch}>
          Cari
        </button>
      </div>
      {search.state === 'loading' && (
        <p className="field-hint" role="status">
          Mencari lokasi…
        </p>
      )}
      {search.state === 'error' && (
        <p className="field-hint" role="status">
          {search.message}
        </p>
      )}
      {search.results.length > 0 && (
        <ul className="address-results" aria-label="Hasil pencarian lokasi">
          {search.results.map((result) => (
            <li key={result.id}>
              <button
                type="button"
                onClick={() => {
                  textEdited.current = false;
                  moveTo(result);
                  setSearch({ state: 'idle', results: [] });
                }}
              >
                <MapPinIcon size={18} />
                <span>{result.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <PinMap center={initialCenter} onMove={setPoint} mapRef={mapRef} />
      <div className="address-form__locate">
        <button type="button" className="link-button link-button--flush" onClick={useMyLocation}>
          <CrosshairIcon />
          Gunakan lokasi saya
        </button>
        {geo.message && (
          <p
            className={`field-hint${geo.state === 'error' ? ' field-hint--warn' : ''}`}
            role="status"
          >
            {geo.state === 'loading' && <SpinnerIcon size={16} className="spin" />}
            {geo.message}
          </p>
        )}
      </div>

      <fieldset className="address-labels">
        <legend className="field-label">Simpan sebagai</legend>
        <div className="address-labels__options">
          {ADDRESS_LABELS.map((option) => {
            const Icon = LABEL_ICONS[option];
            return (
              <label key={option} className="address-label-chip">
                <input
                  type="radio"
                  name={`${id}-label`}
                  value={option}
                  checked={label === option}
                  onChange={() => setLabel(option)}
                />
                <span>
                  <Icon size={18} />
                  {option}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor={`${id}-text`} className="field-label">
          Alamat lengkap{' '}
          <span className="field-required" aria-hidden="true">
            *
          </span>
          <span className="visually-hidden">(wajib)</span>
        </label>
        <div className={`input-shell input-shell--area${error ? ' input-shell--invalid' : ''}`}>
          <MapPinIcon className="input-shell__icon input-shell__icon--top" />
          <textarea
            id={`${id}-text`}
            rows={3}
            maxLength={ADDRESS_TEXT_MAX}
            className="input-shell__control"
            placeholder="Nama jalan, nomor rumah, kelurahan, kecamatan, kota"
            value={text}
            onChange={(event) => {
              textEdited.current = true;
              setText(event.target.value);
              if (error) setError('');
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-text-error` : `${id}-text-hint`}
          />
        </div>
        {error ? (
          <p id={`${id}-text-error`} className="field-error">
            {error}
          </p>
        ) : (
          <p id={`${id}-text-hint`} className="field-hint">
            Terisi otomatis dari titik peta. Periksa dan lengkapi bila perlu.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor={`${id}-detail`} className="field-label">
          Detail lainnya <span className="booking-card__optional">(opsional)</span>
        </label>
        <div className="input-shell">
          <input
            id={`${id}-detail`}
            type="text"
            maxLength={ADDRESS_DETAIL_MAX}
            className="input-shell__control"
            placeholder="Contoh: pagar hijau, dekat masjid, lantai 2"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
          />
        </div>
      </div>

      <label className="address-primary">
        <input
          type="checkbox"
          checked={primary}
          onChange={(event) => setPrimary(event.target.checked)}
        />
        Jadikan alamat utama
      </label>

      <div className="dialog__actions">
        <button type="button" className="btn btn--outline" onClick={onClose}>
          Batal
        </button>
        <button type="submit" className="btn btn--primary">
          Simpan Alamat
        </button>
      </div>
    </form>
  );
}

/**
 * Pop-up Tambah Alamat: cari lokasi, geser peta (drop pin), alamat terisi otomatis dari
 * titik peta, lalu label & detail. Dirender di <body> agar form-nya tidak bersarang di
 * form pesanan.
 */
export default function AddressDialog({ open, initialCenter, onSave, onClose }) {
  const center =
    Number.isFinite(initialCenter?.lat) && Number.isFinite(initialCenter?.lng)
      ? initialCenter
      : BANDUNG;
  return createPortal(
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="tambah-alamat-title"
      className="dialog--address"
    >
      {open && <AddressForm initialCenter={center} onSave={onSave} onClose={onClose} />}
    </Dialog>,
    document.body,
  );
}
