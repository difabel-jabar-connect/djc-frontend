import { useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/context/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { deletePhoto, uploadPhoto } from '@/features/account/accountApi';
import { PATHS } from '@/routes/paths';
import {
  AlertIcon,
  BagIcon,
  ChevronRightIcon,
  GoogleMarkIcon,
  ImageIcon,
  MailIcon,
  PhoneIcon,
  SpinnerIcon,
  TrashIcon,
} from '@/components/ui/icons';
import AddressesPanel from './AddressesPanel';
import PersonalPanel from './PersonalPanel';
import SecurityPanel from './SecurityPanel';
import { displayPhone, useSessionUpdate } from './accountUtils';
import './profile.css';

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Kolom identitas: foto/inisial, nama, kontak, dan tautan Pesanan Saya. */
function IdentityPanel({ user }) {
  const id = useId();
  const updateSession = useSessionUpdate();
  const inputRef = useRef(null);
  const [photo, setPhoto] = useState({ state: 'idle', message: '' });
  const busy = photo.state === 'saving';
  const google = user.has_password === false;

  const changePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhoto({ state: 'error', message: 'Pilih foto JPG, PNG, WebP, GIF, atau AVIF.' });
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setPhoto({ state: 'error', message: 'Ukuran foto maksimal 5 MB.' });
      return;
    }
    setPhoto({ state: 'saving', message: '' });
    try {
      updateSession(await uploadPhoto(await readAsDataUrl(file)));
      setPhoto({ state: 'done', message: 'Foto profil diperbarui.' });
    } catch (error) {
      setPhoto({ state: 'error', message: error.message || 'Foto gagal diunggah.' });
    }
  };

  const removePhoto = async () => {
    setPhoto({ state: 'saving', message: '' });
    try {
      updateSession(await deletePhoto());
      setPhoto({ state: 'done', message: 'Foto profil dihapus.' });
    } catch (error) {
      setPhoto({ state: 'error', message: error.message || 'Foto gagal dihapus.' });
    }
  };

  return (
    <section className="profile-panel profile-identity" aria-labelledby={`${id}-name`}>
      <div className="profile-identity__photo">
        <span className="profile-avatar" aria-hidden="true">
          {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.initials}
          {busy && (
            <span className="profile-avatar__busy">
              <SpinnerIcon size={24} className="spin" />
            </span>
          )}
        </span>
        <div className="profile-identity__photo-actions">
          <input
            ref={inputRef}
            id={`${id}-photo`}
            type="file"
            accept={PHOTO_TYPES.join(',')}
            className="visually-hidden"
            tabIndex={-1}
            onChange={changePhoto}
          />
          <button
            type="button"
            className="link-button link-button--flush"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <ImageIcon size={18} />
            {user.avatar_url ? 'Ganti foto' : 'Tambah foto'}
          </button>
          {user.avatar_url && (
            <button
              type="button"
              className="link-button link-button--flush profile-identity__remove"
              onClick={removePhoto}
              disabled={busy}
            >
              <TrashIcon size={18} />
              Hapus foto
            </button>
          )}
        </div>
      </div>
      <p
        className={`profile-identity__photo-msg${photo.state === 'error' ? ' is-error' : ''}`}
        role={photo.state === 'error' ? 'alert' : 'status'}
      >
        {photo.state === 'error' && <AlertIcon size={16} />}
        {photo.message}
      </p>

      <div className="profile-identity__who">
        <h2 id={`${id}-name`} className="profile-identity__name">
          {user.name}
        </h2>
        <dl className="profile-identity__contact">
          <div>
            <dt>
              <MailIcon size={18} />
              <span className="visually-hidden">Email</span>
            </dt>
            <dd>{user.email ?? 'Belum ada email'}</dd>
          </div>
          <div>
            <dt>
              <PhoneIcon size={18} />
              <span className="visually-hidden">Nomor HP</span>
            </dt>
            <dd>{user.phone ? displayPhone(user.phone) : 'Nomor HP belum diisi'}</dd>
          </div>
        </dl>
        {google && (
          <p className="profile-identity__google">
            <GoogleMarkIcon size={18} />
            Masuk dengan Google
          </p>
        )}
      </div>

      <nav className="profile-identity__nav" aria-label="Akun">
        <Link to={PATHS.customerBookings} className="profile-identity__link">
          <BagIcon size={20} />
          Pesanan Saya
          <ChevronRightIcon size={18} />
        </Link>
      </nav>
    </section>
  );
}

/**
 * Profil Saya (pelanggan): identitas di kolom kiri, alamat tersimpan sebagai area kerja
 * utama di kanan, lalu Data Diri dan Keamanan. Data dari backend (/me, /me/addresses).
 */
export default function ProfilePage() {
  useDocumentTitle('Profil Saya');
  const { user } = useAuth();

  return (
    <div className="customer-page profile-page">
      <div className="container customer-page__inner">
        <nav aria-label="Breadcrumb">
          <ol className="breadcrumb breadcrumb--chevron customer-breadcrumb">
            <li>
              <Link to={PATHS.home}>Beranda</Link>
            </li>
            <li aria-hidden="true">
              <ChevronRightIcon size={16} />
            </li>
            <li aria-current="page">Profil Saya</li>
          </ol>
        </nav>

        <header className="customer-page__head">
          <h1>Profil Saya</h1>
          <p>Data diri, alamat, dan kata sandi yang dipakai saat Anda memesan layanan.</p>
        </header>

        <div className="profile-layout">
          <IdentityPanel user={user} />
          <div className="profile-main">
            <AddressesPanel user={user} />
            <PersonalPanel user={user} />
            <SecurityPanel user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
