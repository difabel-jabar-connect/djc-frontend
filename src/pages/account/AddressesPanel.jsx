import { useEffect, useId, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Dialog from '@/components/ui/Dialog';
import AddressDialog from '@/components/address/AddressDialog';
import {
  ADDRESS_LIMIT,
  addAddress,
  editAddress,
  removeAddress,
  useAddressBook,
} from '@/features/booking/addressBook';
import { JABAR_MAX_BOUNDS } from '@/features/map/jabarGeo';
import {
  AlertIcon,
  BuildingIcon,
  HomeIcon,
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  RefreshIcon,
  SpinnerIcon,
  StarOutlineIcon,
  TrashIcon,
} from '@/components/ui/icons';
import { FormStatus, PanelHead } from './accountParts';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ICONS = { Rumah: HomeIcon, Kantor: BuildingIcon };

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const hasPoint = (a) => Number.isFinite(a.lat) && Number.isFinite(a.lng);

/**
 * Peta pin alamat tersimpan: setiap alamat jadi pin bertuliskan labelnya (utama = navy).
 * Pin yang sedang disorot (baris daftar di-hover/fokus) ikut menyala; klik pin memindahkan
 * fokus ke barisnya. Peta hanya penunjuk: semua aksi ada di daftar.
 */
function AddressPinMap({ addresses, activeId, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const points = addresses.filter(hasPoint);
  const signature = points
    .map((a) => `${a.id}:${a.lat},${a.lng}:${a.label}:${a.primary}`)
    .join('|');

  useEffect(() => {
    const map = L.map(containerRef.current, {
      zoomControl: true,
      minZoom: 8,
      maxZoom: 18,
      maxBounds: JABAR_MAX_BOUNDS,
      maxBoundsViscosity: 0.9,
      scrollWheelZoom: false,
      keyboard: false,
    });
    L.tileLayer(TILE_URL, {
      maxZoom: 19,
      attribution: TILE_ATTRIBUTION,
      // Tile server OSM menolak request tanpa Referer (index.html memasang no-referrer).
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).addTo(map);
    map.attributionControl.setPrefix(false);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = new Map();
    points.forEach((address) => {
      const icon = L.divIcon({
        className: 'profile-pin-marker',
        html: `<span class="profile-pin${address.primary ? ' profile-pin--primary' : ''}">${escapeHtml(address.label)}</span>`,
        iconSize: null,
        iconAnchor: [0, 0],
      });
      const marker = L.marker([address.lat, address.lng], { icon, keyboard: false })
        .on('click', () => onPickRef.current(address.id))
        .addTo(map);
      markersRef.current.set(address.id, marker);
    });
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15);
    else if (points.length > 1) {
      map.fitBounds(
        points.map((a) => [a.lat, a.lng]),
        { padding: [48, 48], maxZoom: 15 },
      );
    } else map.setView([-6.9175, 107.6191], 11);
    requestAnimationFrame(() => map.invalidateSize());
    // `signature` merangkum titik, label, dan status utama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      marker.getElement()?.classList.toggle('is-active', id === activeId);
      if (id === activeId) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    });
  }, [activeId, signature]);

  return (
    <div className="profile-map">
      <div
        ref={containerRef}
        className="profile-map__canvas"
        role="img"
        aria-label={`Peta ${points.length} alamat tersimpan. Gunakan daftar di bawah untuk mengelolanya.`}
      />
    </div>
  );
}

function DeleteDialog({ address, onClose, onConfirm }) {
  const id = useId();
  const [state, setState] = useState({ busy: false, error: '' });
  const confirm = async () => {
    setState({ busy: true, error: '' });
    try {
      await onConfirm();
    } catch (error) {
      setState({ busy: false, error: error.message || 'Alamat gagal dihapus.' });
    }
  };
  return (
    <Dialog
      open={Boolean(address)}
      onClose={() => !state.busy && onClose()}
      labelledBy={`${id}-title`}
      describedBy={`${id}-address ${id}-desc`}
      className="dialog--sm"
    >
      {address && (
        <div className="dialog__form">
          <div className="dialog__head">
            <div className="dialog__head-text">
              <h2 id={`${id}-title`} className="dialog__title">
                Hapus alamat {address.label}?
              </h2>
              <p id={`${id}-address`} className="dialog__desc">
                <strong>{address.text}</strong>
              </p>
              <p id={`${id}-desc`} className="dialog__desc">
                {address.primary &&
                  'Ini alamat utama; alamat terbaru berikutnya akan menjadi alamat utama. '}
                Pesanan yang sudah dibuat tidak berubah.
              </p>
            </div>
          </div>
          {state.error && (
            <p className="address-form__error" role="alert">
              <AlertIcon size={18} />
              {state.error}
            </p>
          )}
          <div className="dialog__actions">
            <button
              type="button"
              className="btn btn--outline"
              onClick={onClose}
              disabled={state.busy}
            >
              Batal
            </button>
            <button
              type="button"
              className="btn btn--danger-solid"
              onClick={confirm}
              disabled={state.busy}
              aria-busy={state.busy}
            >
              {state.busy ? <SpinnerIcon size={18} className="spin" /> : <TrashIcon size={18} />}
              {state.busy ? 'Menghapus…' : 'Hapus alamat'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

/** Alamat Tersimpan: peta pin + daftar dengan Ubah / Jadikan utama / Hapus. */
export default function AddressesPanel({ user }) {
  const id = useId();
  const { status, addresses, error, reload } = useAddressBook(user);
  const [dialog, setDialog] = useState(null); // null | { mode: 'add' } | { mode: 'edit', address }
  const [deleting, setDeleting] = useState(null);
  const [active, setActive] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState({ state: 'idle', message: '' });
  const listRef = useRef(null);
  const loaded = status === 'ready';
  const hasList = loaded && addresses.length > 0;
  const full = addresses.length >= ADDRESS_LIMIT;
  const primary = addresses.find((a) => a.primary);

  // Baris yang ditunjuk (hover) atau difokus menyorot pinnya di peta. Lewat delegasi di <ul>
  // supaya <li> tetap elemen daftar biasa (bukan kontrol interaktif).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const rowId = (event) => event.target.closest?.('[data-address-id]')?.dataset.addressId;
    const enter = (event) => {
      const next = rowId(event);
      if (next) setActive(next);
    };
    const leave = (event) => {
      if (!list.contains(event.relatedTarget)) setActive(null);
    };
    list.addEventListener('pointerover', enter);
    list.addEventListener('focusin', enter);
    list.addEventListener('pointerleave', leave);
    list.addEventListener('focusout', leave);
    return () => {
      list.removeEventListener('pointerover', enter);
      list.removeEventListener('focusin', enter);
      list.removeEventListener('pointerleave', leave);
      list.removeEventListener('focusout', leave);
    };
  }, [hasList]);

  const focusRow = (addressId) => {
    setActive(addressId);
    requestAnimationFrame(() => document.getElementById(`${id}-${addressId}`)?.focus());
  };

  const save = async (values) => {
    if (dialog.mode === 'edit') {
      const updated = await editAddress(user, dialog.address.id, values);
      setNotice({ state: 'done', message: `Alamat ${updated.label} diperbarui.` });
      setDialog(null);
      focusRow(updated.id);
    } else {
      const created = await addAddress(user, values);
      setNotice({ state: 'done', message: `Alamat ${created.label} ditambahkan.` });
      setDialog(null);
      focusRow(created.id);
    }
  };

  const makePrimary = async (address) => {
    setBusyId(address.id);
    try {
      await editAddress(user, address.id, { primary: true });
      setNotice({ state: 'done', message: `${address.label} sekarang alamat utama.` });
      focusRow(address.id);
    } catch (err) {
      setNotice({ state: 'error', message: err.message || 'Alamat utama gagal diganti.' });
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    const target = deleting;
    await removeAddress(user, target.id);
    setDeleting(null);
    setNotice({ state: 'done', message: `Alamat ${target.label} dihapus.` });
    document.getElementById(`${id}-add`)?.focus();
  };

  const count = loaded ? `${addresses.length} dari ${ADDRESS_LIMIT} alamat` : null;

  return (
    <section className="profile-panel profile-addresses" aria-labelledby={`${id}-title`}>
      <PanelHead
        id={`${id}-title`}
        title="Alamat Tersimpan"
        description={
          count
            ? `${count}. Alamat utama otomatis terpilih saat Anda memesan.`
            : 'Alamat utama otomatis terpilih saat Anda memesan.'
        }
        action={
          loaded &&
          addresses.length > 0 && (
            <button
              id={`${id}-add`}
              type="button"
              className="btn btn--primary btn--sm"
              onClick={() => setDialog({ mode: 'add' })}
              disabled={full}
              aria-describedby={full ? `${id}-full` : undefined}
            >
              <PlusIcon size={18} strokeWidth={2.5} />
              Tambah alamat
            </button>
          )
        }
      />
      {full && (
        <p id={`${id}-full`} className="field-hint">
          Sudah {ADDRESS_LIMIT} alamat. Hapus alamat yang tidak dipakai untuk menambah yang baru.
        </p>
      )}

      {status === 'loading' && (
        <p className="profile-addresses__state" role="status">
          <SpinnerIcon size={20} className="spin" />
          Memuat alamat tersimpan…
        </p>
      )}

      {status === 'error' && (
        <div className="profile-addresses__state profile-addresses__state--error" role="alert">
          <AlertIcon size={20} />
          <p>{error?.message || 'Alamat tersimpan gagal dimuat.'}</p>
          <button type="button" className="btn btn--outline btn--sm" onClick={reload}>
            <RefreshIcon size={18} />
            Coba lagi
          </button>
        </div>
      )}

      {loaded && addresses.length === 0 && (
        <div className="profile-addresses__empty">
          <span className="profile-addresses__empty-pin" aria-hidden="true">
            <MapPinIcon size={28} />
          </span>
          <div>
            <h3>Belum ada alamat</h3>
            <p>
              Simpan alamat rumah atau kantor dengan titik di peta, supaya penyedia tahu lokasi Anda
              dan Anda tidak perlu mengetik ulang setiap memesan.
            </p>
          </div>
          <button
            id={`${id}-add`}
            type="button"
            className="btn btn--primary"
            onClick={() => setDialog({ mode: 'add' })}
          >
            <PlusIcon size={18} strokeWidth={2.5} />
            Tambah alamat
          </button>
        </div>
      )}

      {hasList && (
        <>
          <AddressPinMap addresses={addresses} activeId={active} onPick={focusRow} />
          <ul ref={listRef} className="profile-address-list" aria-label="Daftar alamat tersimpan">
            {addresses.map((address) => {
              const Icon = ICONS[address.label] ?? MapPinIcon;
              const busy = busyId === address.id;
              return (
                <li
                  key={address.id}
                  data-address-id={address.id}
                  className={`profile-address${active === address.id ? ' is-active' : ''}`}
                >
                  <div
                    id={`${id}-${address.id}`}
                    className="profile-address__body"
                    tabIndex={-1}
                    aria-label={`${address.label}${address.primary ? ', alamat utama' : ''}`}
                  >
                    <p className="profile-address__head">
                      <Icon size={18} />
                      <strong>{address.label}</strong>
                      {address.primary && <span className="address-badge">Utama</span>}
                    </p>
                    <p className="profile-address__text">{address.text}</p>
                    {address.detail && <p className="profile-address__detail">{address.detail}</p>}
                    {!hasPoint(address) && (
                      <p className="profile-address__warn">
                        <AlertIcon size={16} />
                        Belum ada titik peta. Ubah alamat untuk memilih titiknya.
                      </p>
                    )}
                  </div>
                  <div className="profile-address__actions">
                    <button
                      type="button"
                      className="profile-address__action"
                      onClick={() => setDialog({ mode: 'edit', address })}
                      aria-label={`Ubah alamat ${address.label}`}
                    >
                      <PencilIcon size={18} />
                      <span aria-hidden="true">Ubah</span>
                    </button>
                    {!address.primary && (
                      <button
                        type="button"
                        className="profile-address__action"
                        onClick={() => makePrimary(address)}
                        disabled={busy}
                        aria-busy={busy}
                        aria-label={`Jadikan ${address.label} alamat utama`}
                      >
                        {busy ? (
                          <SpinnerIcon size={18} className="spin" />
                        ) : (
                          <StarOutlineIcon size={18} />
                        )}
                        <span aria-hidden="true">Jadikan utama</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="profile-address__action profile-address__action--danger"
                      onClick={() => setDeleting(address)}
                      aria-label={`Hapus alamat ${address.label}`}
                    >
                      <TrashIcon size={18} />
                      <span aria-hidden="true">Hapus</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <FormStatus status={notice} />

      <AddressDialog
        open={Boolean(dialog)}
        address={dialog?.mode === 'edit' ? dialog.address : undefined}
        initialCenter={primary}
        onSave={save}
        onClose={() => setDialog(null)}
      />
      <DeleteDialog
        address={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
