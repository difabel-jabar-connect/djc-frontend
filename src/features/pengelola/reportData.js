import { formatDate } from '@/features/admin/adminFormat';
import { BOOKING_STATUS } from '@/features/booking/customerBookings';
import { formatRupiah } from '@/lib/format';
import {
  ALUMNI_STATUS,
  PROFILE_FIELDS,
  PROGRAM_STATS,
  RATING_DISTRIBUTION,
  REGIONS,
  REPORT_TYPES,
  SERVICE_STATUS,
  profileScore,
} from './pengelolaData';
import { formatPeriod, formatScore, inPeriod, sameCity } from './pengelolaFormat';

/** Angka KPI ringkasan program (dipakai Ringkasan & Laporan). */
export function programKpis(regions = REGIONS) {
  const reached = regions.filter((r) => r.providers > 0).length;
  const { value, goal } = PROGRAM_STATS.target;
  return {
    verified: PROGRAM_STATS.verified,
    activeServices: PROGRAM_STATS.withActiveService,
    totalOrders: PROGRAM_STATS.totalOrders,
    reached,
    regionCount: regions.length,
    targetValue: value,
    targetGoal: goal,
    targetPercent: Math.round((value / goal) * 100),
  };
}

/**
 * Tabel isi laporan: `{ columns, rows }` sesuai jenis dan filter.
 * `source` = { alumni, services, orders, categories, regions }.
 */
export function reportTable(type, source, { from, to, category = '', city = '' }) {
  const categoryName = (id) => source.categories.find((c) => c.id === id)?.name ?? '–';
  const providerName = (id) => source.alumni.find((a) => a.id === id)?.name ?? id;
  const matchCity = (value) => !city || sameCity(value, city);
  const matchCategory = (value) => !category || value === category;

  switch (type) {
    case 'alumni':
      return {
        columns: [
          'Nama',
          'Keahlian',
          'Kota/Kabupaten',
          'Layanan Aktif',
          'Rating',
          'Pesanan Selesai',
          'Kelengkapan',
          'Status',
          'Tanggal Daftar',
        ],
        rows: source.alumni
          .filter((a) => matchCategory(a.category) && matchCity(a.city))
          .map((a) => [
            a.name,
            categoryName(a.category),
            a.city,
            source.services.filter((s) => s.provider === a.id && s.status === 'aktif').length,
            formatScore(a.rating),
            a.completed,
            `${profileScore(a)}/${PROFILE_FIELDS.length}`,
            ALUMNI_STATUS[a.status].label,
            formatDate(a.joinedAt),
          ]),
      };
    case 'layanan':
      return {
        columns: [
          'Layanan',
          'Kategori',
          'Penyedia',
          'Harga',
          'Kota',
          'Rating',
          'Pesanan',
          'Status',
        ],
        rows: source.services
          .filter((s) => {
            const owner = source.alumni.find((a) => a.id === s.provider);
            return matchCategory(s.category) && matchCity(owner?.city ?? '');
          })
          .map((s) => [
            s.name,
            categoryName(s.category),
            providerName(s.provider),
            `${formatRupiah(s.price)}/${s.unit}`,
            source.alumni.find((a) => a.id === s.provider)?.city ?? '–',
            formatScore(s.rating),
            s.orders,
            SERVICE_STATUS[s.status].label,
          ]),
      };
    case 'pesanan':
      return {
        columns: [
          'Kode',
          'Pengguna',
          'Penyedia',
          'Layanan',
          'Kategori',
          'Estimasi',
          'Status',
          'Dibuat',
        ],
        rows: source.orders
          .filter(
            (o) =>
              inPeriod(o.createdAt, from, to) && matchCategory(o.category) && matchCity(o.city),
          )
          .map((o) => [
            o.code,
            o.customer,
            o.provider,
            o.service,
            categoryName(o.category),
            formatRupiah(o.unitPrice * o.qty),
            BOOKING_STATUS[o.status].label,
            formatDate(o.createdAt),
          ]),
      };
    case 'ulasan':
      return {
        columns: ['Rating', 'Persentase ulasan'],
        rows: [5, 4, 3, 2, 1].map((star) => [`${star} bintang`, `${RATING_DISTRIBUTION[star]}%`]),
      };
    case 'wilayah':
      return {
        columns: [
          'Kota/Kabupaten',
          'Penyedia',
          'Layanan Aktif',
          'Pesanan',
          'Rating Rata-rata',
          'Kategori Terbanyak',
        ],
        rows: source.regions
          .filter((r) => matchCity(r.name))
          .map((r) => [
            r.name,
            r.providers,
            r.services,
            r.orders,
            formatScore(r.rating),
            r.top ? categoryName(r.top) : '–',
          ]),
      };
    default: {
      const kpi = programKpis(source.regions);
      return {
        columns: ['Indikator', 'Nilai'],
        rows: [
          ['Alumni terverifikasi', kpi.verified],
          ['Layanan aktif', kpi.activeServices],
          ['Total pesanan', kpi.totalOrders],
          ['Kota/kabupaten terjangkau', `${kpi.reached}/${kpi.regionCount}`],
          ['Capaian target 2026', `${kpi.targetPercent}%`],
        ],
      };
    }
  }
}

/** Baris teks untuk PDF: judul periode, pembuat, lalu tabel sebagai daftar. */
export function reportLines(report, table) {
  const type = REPORT_TYPES.find((t) => t.id === report.type);
  const lines = [
    `Difabel Jabar Connect - UPTD PPSGHD Jawa Barat`,
    `${type.title} - ${formatPeriod(report.from, report.to)}`,
    `Dibuat oleh ${report.by} - ${formatDate(report.at)}`,
    '',
    `# ${table.columns.join(' | ')}`,
  ];
  table.rows.forEach((row) => lines.push(row.join(' | ')));
  if (!table.rows.length) lines.push('Tidak ada data untuk filter ini.');
  return lines;
}
