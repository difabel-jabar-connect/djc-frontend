import { useMemo } from 'react';
import { useAdmin } from '@/context/useAdmin';
import { formatPeriod } from './pengelolaFormat';
import { REPORT_TYPES } from './pengelolaData';

const statusChange = (before, beforeTone, after, afterTone) => ({
  field: 'Status',
  before,
  beforeTone,
  after,
  afterTone,
});

/**
 * Aksi Panel Pengelola. Semua memakai `commit` AdminContext sehingga tercatat di
 * Audit Log yang sama dengan area Admin.
 * TODO(API): ganti setiap aksi dengan endpoint pengelola.
 */
export function usePengelolaActions() {
  const { commit, actor, verifications, alumni, services } = useAdmin();

  return useMemo(
    () => ({
      /** Kembalikan pendaftaran ke alumni untuk diperbaiki (tab "Perlu Perbaikan Data"). */
      requestRevision: (id, sections, note) => {
        const item = verifications.find((v) => v.id === id);
        commit(
          (prev, now) => ({
            ...prev,
            verifications: prev.verifications.map((v) =>
              v.id === id
                ? {
                    ...v,
                    status: 'perbaikan',
                    revision: {
                      sections,
                      note,
                      by: actor.name,
                      requestedAt: now.toISOString(),
                      resubmitted: false,
                    },
                  }
                : v,
            ),
          }),
          {
            action: 'minta_perbaikan',
            target: { type: 'verifikasi', label: item.name },
            reason: `${sections.join(', ')}: ${note}`,
            change: statusChange(
              item.status === 'perbaikan' ? 'Perlu Perbaikan' : 'Menunggu',
              item.status === 'perbaikan' ? 'orange' : 'warning',
              'Perlu Perbaikan',
              'orange',
            ),
          },
        );
      },

      /** Minta alumni terverifikasi melengkapi data (mis. titik lokasi di halaman Wilayah). */
      requestAlumniRevision: (id, sections, note) => {
        const item = alumni.find((a) => a.id === id);
        commit(
          (prev, now) => ({
            ...prev,
            alumni: prev.alumni.map((a) =>
              a.id === id
                ? {
                    ...a,
                    revisionRequest: { sections, note, by: actor.name, at: now.toISOString() },
                  }
                : a,
            ),
          }),
          {
            action: 'minta_perbaikan',
            target: { type: 'alumni', label: item.name },
            reason: `${sections.join(', ')}: ${note}`,
          },
        );
      },

      /** Sembunyikan layanan yang melanggar ketentuan (tidak tampil di pencarian). */
      hideService: (id, reason) => {
        const item = services.find((s) => s.id === id);
        commit(
          (prev, now) => ({
            ...prev,
            services: prev.services.map((s) =>
              s.id === id
                ? {
                    ...s,
                    previousStatus: s.status,
                    status: 'disembunyikan',
                    hidden: { by: actor.name, at: now.toISOString(), reason },
                    updatedAt: now.toISOString(),
                  }
                : s,
            ),
          }),
          {
            action: 'sembunyikan_layanan',
            target: { type: 'layanan', label: item.name },
            reason,
            change: statusChange(
              item.status === 'nonaktif' ? 'Nonaktif' : 'Aktif',
              item.status === 'nonaktif' ? 'neutral' : 'success',
              'Disembunyikan',
              'neutral',
            ),
          },
        );
      },

      showService: (id, reason) => {
        const item = services.find((s) => s.id === id);
        const restored = item.previousStatus === 'nonaktif' ? 'nonaktif' : 'aktif';
        commit(
          (prev, now) => ({
            ...prev,
            services: prev.services.map((s) =>
              s.id === id
                ? { ...s, status: restored, hidden: null, updatedAt: now.toISOString() }
                : s,
            ),
          }),
          {
            action: 'tampilkan_layanan',
            target: { type: 'layanan', label: item.name },
            reason,
            change: statusChange(
              'Disembunyikan',
              'neutral',
              restored === 'aktif' ? 'Aktif' : 'Nonaktif',
              restored === 'aktif' ? 'success' : 'neutral',
            ),
          },
        );
      },

      /** Buat laporan program; masuk ke Riwayat Laporan. Mengembalikan entri laporan. */
      createReport: (values) => {
        const type = REPORT_TYPES.find((t) => t.id === values.type);
        const report = {
          id: `r-${Date.now()}`,
          by: actor.name,
          at: new Date().toISOString(),
          ...values,
        };
        commit((prev) => ({ ...prev, reports: [report, ...prev.reports] }), {
          action: 'buat_laporan',
          target: {
            type: 'laporan',
            label: `${type.label} · ${formatPeriod(values.from, values.to)}`,
          },
          reason: `Format ${values.format.toUpperCase()}.`,
        });
        return report;
      },
    }),
    [commit, actor.name, verifications, alumni, services],
  );
}
