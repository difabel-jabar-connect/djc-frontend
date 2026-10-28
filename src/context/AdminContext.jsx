import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SAMPLE_AUDIT_LOG,
  SAMPLE_CATEGORIES,
  SAMPLE_ORDERS,
  SAMPLE_REVIEWS,
  SAMPLE_USERS,
  SAMPLE_VERIFICATIONS,
} from '@/features/admin/adminData';
import {
  INVITE_HOURS,
  formatPhone,
  generateTempPassword,
  regionShort,
} from '@/features/admin/accountForm';
import { avatarColor, initialsOf } from '@/features/admin/adminFormat';
import { AdminContext } from './useAdmin';

/** Jeda tiruan "Memproses..." agar tombol tidak terkirim dua kali (0 saat test). */
const LATENCY = import.meta.env.MODE === 'test' ? 0 : 600;
const TOAST_MS = 6000;

const initialData = () => ({
  verifications: SAMPLE_VERIFICATIONS,
  users: SAMPLE_USERS,
  categories: SAMPLE_CATEGORIES,
  reviews: SAMPLE_REVIEWS,
  orders: SAMPLE_ORDERS,
  audit: SAMPLE_AUDIT_LOG,
});

/** "LOG-2026-10-28-00419": tanggal WIB + nomor urut berikutnya. */
function nextLogId(audit, now) {
  const seq = audit.reduce(
    (max, entry) => Math.max(max, Number(entry.id.split('-').pop()) || 0),
    0,
  );
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return `LOG-${wib}-${String(seq + 1).padStart(5, '0')}`;
}

const STATUS_CHANGE = {
  menungguKeDisetujui: {
    field: 'Status',
    before: 'Menunggu',
    beforeTone: 'warning',
    after: 'Disetujui',
    afterTone: 'success',
  },
  menungguKeDitolak: {
    field: 'Status',
    before: 'Menunggu',
    beforeTone: 'warning',
    after: 'Ditolak',
    afterTone: 'danger',
  },
  aktifKeSuspensi: {
    field: 'Status',
    before: 'Aktif',
    beforeTone: 'success',
    after: 'Disuspensi',
    afterTone: 'danger',
  },
  suspensiKeAktif: {
    field: 'Status',
    before: 'Disuspensi',
    beforeTone: 'danger',
    after: 'Aktif',
    afterTone: 'success',
  },
  kategoriNonaktif: {
    field: 'Status',
    before: 'Aktif',
    beforeTone: 'success',
    after: 'Nonaktif',
    afterTone: 'neutral',
  },
  kategoriAktif: {
    field: 'Status',
    before: 'Nonaktif',
    beforeTone: 'neutral',
    after: 'Aktif',
    afterTone: 'success',
  },
};

const REVIEW_LABEL = {
  dilaporkan: 'Dilaporkan',
  ditampilkan: 'Ditampilkan',
  disembunyikan: 'Disembunyikan',
};
const REVIEW_TONE = { dilaporkan: 'warning', ditampilkan: 'success', disembunyikan: 'neutral' };

/**
 * State area Admin: antrean verifikasi, user, kategori, ulasan, pesanan, dan audit log.
 * Setiap aksi admin menambah entri Audit Log. Sementara data contoh + state lokal;
 * TODO(API): ganti setiap aksi dengan panggilan endpoint admin.
 */
export function AdminProvider({ actor, initialState, children }) {
  const [data, setData] = useState(() => ({ ...initialData(), ...initialState }));
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const notify = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const dismissToast = useCallback(() => {
    clearTimeout(toastTimer.current);
    setToast(null);
  }, []);

  /** Ubah data sekaligus catat Audit Log. `entry` = { action, target, reason, change }. */
  const commit = useCallback(
    (update, entry) => {
      const now = new Date();
      setData((prev) => {
        const next = update(prev, now);
        if (!entry) return next;
        return {
          ...next,
          audit: [
            {
              id: nextLogId(prev.audit, now),
              at: now.toISOString(),
              actor: { name: actor.name, initials: actor.initials, color: actor.color },
              change: null,
              ...entry,
            },
            ...next.audit,
          ],
        };
      });
    },
    [actor.name, actor.initials, actor.color],
  );

  /** Jalankan aksi setelah jeda tiruan (status "Memproses..." di dialog). */
  const run = useCallback(
    (fn) => new Promise((resolve) => setTimeout(() => resolve(fn()), LATENCY)),
    [],
  );

  const actions = useMemo(() => {
    const decide = (id, status, note, action, change) => {
      const item = data.verifications.find((v) => v.id === id);
      commit(
        (prev, now) => {
          const verifications = prev.verifications.map((v) =>
            v.id === id
              ? { ...v, status, decision: { by: actor.name, at: now.toISOString(), note } }
              : v,
          );
          // Penyedia yang disetujui langsung muncul di Kelola User.
          const users =
            status === 'disetujui' && !prev.users.some((u) => u.id === `p-${id}`)
              ? [
                  {
                    id: `p-${id}`,
                    name: item.name,
                    initials: item.initials,
                    color: item.color,
                    email: item.email,
                    phone: item.phone,
                    role: 'penyedia',
                    position: '',
                    city: item.city,
                    status: 'aktif',
                    joinedAt: now.toISOString(),
                    lastActiveAt: null,
                    suspension: null,
                    invite: null,
                  },
                  ...prev.users,
                ]
              : prev.users;
          return { ...prev, verifications, users };
        },
        { action, target: { type: 'verifikasi', label: item.name }, reason: note, change },
      );
    };

    const setUserStatus = (id, status, reason) => {
      const item = data.users.find((u) => u.id === id);
      const suspend = status === 'disuspensi';
      commit(
        (prev, now) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === id
              ? {
                  ...u,
                  status,
                  suspension: suspend ? { reason, by: actor.name, at: now.toISOString() } : null,
                }
              : u,
          ),
        }),
        {
          action: suspend ? 'suspensi_akun' : 'aktifkan_akun',
          target: { type: 'user', label: item.name },
          reason,
          change: suspend ? STATUS_CHANGE.aktifKeSuspensi : STATUS_CHANGE.suspensiKeAktif,
        },
      );
    };

    const setReviewStatus = (id, status, reason, action) => {
      const item = data.reviews.find((r) => r.id === id);
      commit(
        (prev, now) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  report: status === 'disembunyikan' ? r.report : null,
                  moderation: { by: actor.name, at: now.toISOString(), reason },
                }
              : r,
          ),
        }),
        {
          action,
          target: { type: 'ulasan', label: item.bookingCode },
          reason,
          change: {
            field: 'Ulasan',
            before: REVIEW_LABEL[item.status],
            beforeTone: REVIEW_TONE[item.status],
            after: REVIEW_LABEL[status],
            afterTone: REVIEW_TONE[status],
          },
        },
      );
    };

    return {
      approveProvider: (id, note) =>
        decide(id, 'disetujui', note, 'setujui_penyedia', STATUS_CHANGE.menungguKeDisetujui),
      rejectProvider: (id, reason) =>
        decide(id, 'ditolak', reason, 'tolak_penyedia', STATUS_CHANGE.menungguKeDitolak),

      suspendUser: (id, reason) => setUserStatus(id, 'disuspensi', reason),
      activateUser: (id, reason) => setUserStatus(id, 'aktif', reason),

      /** Buat akun Pengguna/Pengelola; mengembalikan user baru (beserta undangan/sandi). */
      createAccount: (form) => {
        const now = new Date();
        const name = form.name.trim();
        const invite =
          form.access === 'undangan'
            ? {
                sentAt: now.toISOString(),
                expiresAt: new Date(now.getTime() + INVITE_HOURS * 60 * 60 * 1000).toISOString(),
                link: `${window.location.origin}/aktivasi?token=${Math.random().toString(36).slice(2, 12)}`,
              }
            : null;
        const created = {
          id: `u-${now.getTime().toString(36)}`,
          name,
          initials: initialsOf(name),
          color: avatarColor(name),
          email: form.email.trim().toLowerCase(),
          phone: formatPhone(form.phone),
          role: form.type,
          position: form.type === 'pengelola' ? form.position.trim() : '',
          city: regionShort(form.region),
          region: form.region,
          status: invite ? 'menunggu' : 'aktif',
          joinedAt: now.toISOString(),
          lastActiveAt: null,
          suspension: null,
          invite,
          tempPassword: invite ? null : generateTempPassword(),
        };
        commit(
          (prev) => ({ ...prev, users: [{ ...created, tempPassword: null }, ...prev.users] }),
          {
            action: 'buat_akun',
            target: { type: 'user', label: name },
            reason:
              form.reason.trim() ||
              `Akun ${form.type === 'pengelola' ? 'Pengelola' : 'Pengguna'} dibuat oleh admin.`,
          },
        );
        return created;
      },

      resendInvite: (id) => {
        const item = data.users.find((u) => u.id === id);
        commit(
          (prev, now) => ({
            ...prev,
            users: prev.users.map((u) =>
              u.id === id
                ? {
                    ...u,
                    invite: {
                      ...u.invite,
                      sentAt: now.toISOString(),
                      expiresAt: new Date(now.getTime() + INVITE_HOURS * 3600000).toISOString(),
                    },
                  }
                : u,
            ),
          }),
          {
            action: 'kirim_undangan',
            target: { type: 'user', label: item.name },
            reason: `Tautan aktivasi baru dikirim ke ${item.email}.`,
          },
        );
      },

      hideReview: (id, reason) =>
        setReviewStatus(id, 'disembunyikan', reason, 'sembunyikan_ulasan'),
      showReview: (id, reason) => setReviewStatus(id, 'ditampilkan', reason, 'tampilkan_ulasan'),
      dismissReport: (id, reason) => setReviewStatus(id, 'ditampilkan', reason, 'abaikan_laporan'),

      /** Tambah (tanpa `id`) atau ubah kategori. */
      saveCategory: (values, id) => {
        const name = values.name.trim();
        if (!id) {
          const created = {
            id: `k-${Date.now().toString(36)}`,
            name,
            icon: values.icon,
            description: values.description.trim(),
            services: 0,
            active: values.active,
            updatedAt: new Date().toISOString(),
          };
          commit((prev) => ({ ...prev, categories: [...prev.categories, created] }), {
            action: 'tambah_kategori',
            target: { type: 'kategori', label: name },
            reason: `Kategori baru${values.active ? '' : ' (nonaktif)'} ditambahkan.`,
          });
          return;
        }
        const before = data.categories.find((c) => c.id === id);
        const changed = [
          before.name !== name && 'nama',
          before.icon !== values.icon && 'ikon',
          before.description !== values.description.trim() && 'deskripsi',
          before.active !== values.active && 'status',
        ].filter(Boolean);
        commit(
          (prev, now) => ({
            ...prev,
            categories: prev.categories.map((c) =>
              c.id === id
                ? {
                    ...c,
                    name,
                    icon: values.icon,
                    description: values.description.trim(),
                    active: values.active,
                    updatedAt: now.toISOString(),
                  }
                : c,
            ),
          }),
          {
            action: 'ubah_kategori',
            target: { type: 'kategori', label: name },
            reason: changed.length
              ? `Memperbarui ${changed.join(', ')} kategori.`
              : 'Menyimpan kategori tanpa perubahan.',
          },
        );
      },

      toggleCategory: (id, reason) => {
        const item = data.categories.find((c) => c.id === id);
        commit(
          (prev, now) => ({
            ...prev,
            categories: prev.categories.map((c) =>
              c.id === id ? { ...c, active: !c.active, updatedAt: now.toISOString() } : c,
            ),
          }),
          {
            action: item.active ? 'nonaktifkan_kategori' : 'aktifkan_kategori',
            target: { type: 'kategori', label: item.name },
            reason,
            change: item.active ? STATUS_CHANGE.kategoriNonaktif : STATUS_CHANGE.kategoriAktif,
          },
        );
      },

      deleteCategory: (id) => {
        const item = data.categories.find((c) => c.id === id);
        commit((prev) => ({ ...prev, categories: prev.categories.filter((c) => c.id !== id) }), {
          action: 'hapus_kategori',
          target: { type: 'kategori', label: item.name },
          reason: 'Kategori tanpa layanan dihapus permanen.',
        });
      },
    };
  }, [data, commit, actor.name]);

  const value = useMemo(
    () => ({ ...data, ...actions, actor, run, toast, notify, dismissToast }),
    [data, actions, actor, run, toast, notify, dismissToast],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
