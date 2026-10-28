import { useId, useState } from 'react';
import Drawer from '@/components/ui/Drawer';
import {
  AlertCircleIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClipboardListIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GraduationIcon,
  MapPinIcon,
  MessageTextIcon,
  UserIcon,
  XCircleIcon,
  XIcon,
} from '@/components/ui/icons';
import { CHECKLIST_ITEMS, VERIFICATION_STATUS, completeness } from '@/features/admin/adminData';
import { formatDateTime } from '@/features/admin/adminFormat';
import { Avatar, Badge, CategoryIcon, DetailList, DrawerSection } from './AdminParts';

const DAYS = [
  [1, 'Sen', 'Senin'],
  [2, 'Sel', 'Selasa'],
  [3, 'Rab', 'Rabu'],
  [4, 'Kam', 'Kamis'],
  [5, 'Jum', 'Jumat'],
  [6, 'Sab', 'Sabtu'],
  [0, 'Min', 'Minggu'],
];

function LocationArt() {
  return (
    <svg className="ad-location-art" viewBox="0 0 480 130" aria-hidden="true" focusable="false">
      <rect width="480" height="130" rx="12" fill="#e8f3fa" />
      <g fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round">
        <path d="M0 90 C120 70 240 110 480 80" />
        <path d="M150 0 C170 60 140 100 160 130" />
        <path d="M330 0 L350 130" />
      </g>
      <circle
        cx="250"
        cy="70"
        r="40"
        fill="#14a3a3"
        fillOpacity="0.1"
        stroke="#0c7272"
        strokeWidth="2"
        strokeDasharray="6 6"
      />
      <g transform="translate(250 72)">
        <path
          d="M0 0 C-2 -7 -14 -14 -14 -26 A14 14 0 1 1 14 -26 C14 -14 2 -7 0 0 Z"
          fill="#0b3c6e"
          stroke="#fff"
          strokeWidth="3"
        />
        <circle cx="0" cy="-26" r="5" fill="#fff" />
      </g>
    </svg>
  );
}

/** Drawer "Tinjau" pendaftaran penyedia (desain Verifikasi · Drawer Tinjau). */
/**
 * `onRequestRevision` (opsional, Panel Pengelola) menambah tombol "Minta Perbaikan".
 */
export default function VerificationDrawer({
  item,
  category,
  onClose,
  onApprove,
  onReject,
  onRequestRevision,
}) {
  const id = useId();
  const [previewNote, setPreviewNote] = useState(false);
  const open = Boolean(item);
  const done = item ? completeness(item) : 0;
  const status = item ? VERIFICATION_STATUS[item.status] : null;
  const checklist = item
    ? [...CHECKLIST_ITEMS].sort(
        (a, b) => Number(item.checklist[a.key]) - Number(item.checklist[b.key]),
      )
    : [];

  return (
    <Drawer open={open} onClose={onClose} labelledBy={`${id}-title`}>
      {item && (
        <>
          <div className="drawer__head">
            <div className="drawer__head-main">
              <Avatar person={item} size={64} />
              <div className="ad-drawer-id">
                <h2 id={`${id}-title`} className="drawer__title">
                  {item.name}
                </h2>
                <div className="ad-drawer-id__meta">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  <span>Daftar {formatDateTime(item.registeredAt)}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="drawer__close"
              aria-label="Tutup panel"
              onClick={onClose}
            >
              <XIcon size={22} strokeWidth={2} />
            </button>
          </div>

          <div className="drawer__body">
            {item.status === 'perbaikan' && item.revision && (
              <div className="ad-callout tone-orange" role="note">
                <AlertCircleIcon size={20} strokeWidth={2.25} />
                <span>
                  <strong>Perbaikan diminta oleh {item.revision.by}</strong> ·{' '}
                  {formatDateTime(item.revision.requestedAt)}
                  <br />
                  Bagian: {item.revision.sections.join(', ')} · {item.revision.note}
                  <br />
                  {item.revision.resubmitted
                    ? 'Alumni sudah mengirim ulang data. Silakan tinjau kembali.'
                    : 'Alumni belum memperbarui data.'}
                </span>
              </div>
            )}
            {item.decision && (
              <div className={`ad-callout tone-${status.tone}`} role="note">
                {item.status === 'disetujui' ? (
                  <CheckCircleIcon size={20} strokeWidth={2.25} />
                ) : (
                  <XCircleIcon size={20} strokeWidth={2.25} />
                )}
                <span>
                  <strong>
                    {status.label} oleh {item.decision.by}
                  </strong>{' '}
                  · {formatDateTime(item.decision.at)}
                  {item.decision.note && (
                    <>
                      <br />
                      {item.status === 'ditolak' ? 'Alasan' : 'Catatan'}: {item.decision.note}
                    </>
                  )}
                </span>
              </div>
            )}

            <DrawerSection id={`${id}-diri`} title="Data Diri" icon={UserIcon}>
              <DetailList
                rows={[
                  ['Nama lengkap', item.name],
                  ['Email', item.email],
                  ['WhatsApp', item.phone],
                ]}
              />
            </DrawerSection>

            <DrawerSection id={`${id}-alumni`} title="Status Alumni" icon={GraduationIcon}>
              {item.alumni ? (
                <div className="ad-file">
                  <FileTextIcon size={22} />
                  <span className="ad-file__text">
                    <strong>{item.alumni.file}</strong>
                    <span>{item.alumni.detail}</span>
                  </span>
                  <button
                    type="button"
                    className="btn btn--outline ad-btn-sm"
                    aria-label={`Lihat ${item.alumni.file}`}
                    onClick={() => setPreviewNote(true)}
                  >
                    <ExternalLinkIcon size={18} strokeWidth={2.25} />
                    Lihat
                  </button>
                </div>
              ) : (
                <p className="ad-callout tone-danger">
                  <AlertCircleIcon size={20} strokeWidth={2.25} />
                  Bukti alumni belum diunggah.
                </p>
              )}
              <p className="ad-hint" role="status">
                {previewNote && 'Pratinjau dokumen tersedia setelah aplikasi terhubung ke server.'}
              </p>
            </DrawerSection>

            <DrawerSection id={`${id}-layanan`} title="Keahlian & Layanan" icon={BriefcaseIcon}>
              <p className="ad-skill">
                <CategoryIcon icon={category?.icon} size={18} />
                {category?.name ?? 'Kategori tidak diketahui'}
              </p>
              {item.services.length ? (
                <ul className="ad-service-list">
                  {item.services.map((service) => (
                    <li key={service.name}>
                      <span>{service.name}</span>
                      <strong>{service.price}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ad-muted-text">Belum ada layanan dengan harga.</p>
              )}
            </DrawerSection>

            <DrawerSection id={`${id}-lokasi`} title="Lokasi" icon={MapPinIcon}>
              {item.checklist.location && <LocationArt />}
              <p className="ad-address">
                <MapPinIcon size={18} />
                {item.address}
              </p>
            </DrawerSection>

            <DrawerSection id={`${id}-jadwal`} title="Jadwal" icon={CalendarIcon}>
              <ul className="ad-days" aria-label="Hari kerja">
                {DAYS.map(([day, short, long]) => {
                  const on = item.workDays.includes(day);
                  return (
                    <li key={day} className={on ? 'ad-day' : 'ad-day ad-day--off'}>
                      <span aria-hidden="true">{short}</span>
                      <span className="visually-hidden">
                        {long}
                        {on ? ', buka' : ', libur'}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="ad-muted-text">{item.hours}</p>
            </DrawerSection>

            <DrawerSection id={`${id}-deskripsi`} title="Deskripsi" icon={MessageTextIcon}>
              <p className="ad-body-text">{item.description}</p>
            </DrawerSection>

            <DrawerSection
              id={`${id}-cek`}
              title={`Checklist Kelengkapan · ${done}/${CHECKLIST_ITEMS.length}`}
              icon={ClipboardListIcon}
            >
              <ul className="ad-checklist">
                {checklist.map(({ key, label }) => {
                  const ok = item.checklist[key];
                  return (
                    <li key={key} className={ok ? 'is-ok' : 'is-missing'}>
                      {ok ? (
                        <CheckCircleIcon size={22} strokeWidth={2.25} />
                      ) : (
                        <XCircleIcon size={22} strokeWidth={2.25} />
                      )}
                      <span className="ad-checklist__label">{label}</span>
                      <strong>{ok ? 'Lengkap' : 'Belum ada'}</strong>
                    </li>
                  );
                })}
              </ul>
            </DrawerSection>
          </div>

          <div className="drawer__foot">
            {item.status === 'menunggu' || item.status === 'perbaikan' ? (
              <>
                <button type="button" className="btn btn--danger btn--md" onClick={onReject}>
                  <XCircleIcon size={18} strokeWidth={2.25} />
                  Tolak
                </button>
                {onRequestRevision && (
                  <button
                    type="button"
                    className="btn btn--md pg-btn-orange-outline"
                    onClick={onRequestRevision}
                  >
                    <AlertCircleIcon size={18} strokeWidth={2.25} />
                    Minta Perbaikan
                  </button>
                )}
                <button type="button" className="btn btn--success btn--md" onClick={onApprove}>
                  <CheckCircleIcon size={18} strokeWidth={2.25} />
                  Setujui
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--outline btn--md" onClick={onClose}>
                Tutup
              </button>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
