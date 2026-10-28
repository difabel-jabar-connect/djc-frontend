/** Format & ekspor (CSV/PDF) untuk Panel Pengelola. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const parts = (iso) => {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);
  return { year, month: month - 1, day };
};

/** "1 – 30 Sep 2026" · "1 Jan – 31 Okt 2026" · "1 Des 2025 – 31 Jan 2026" */
export function formatPeriod(from, to) {
  const a = parts(from);
  const b = parts(to);
  if (a.year === b.year && a.month === b.month)
    return `${a.day} – ${b.day} ${MONTHS[b.month]} ${b.year}`;
  if (a.year === b.year)
    return `${a.day} ${MONTHS[a.month]} – ${b.day} ${MONTHS[b.month]} ${b.year}`;
  return `${a.day} ${MONTHS[a.month]} ${a.year} – ${b.day} ${MONTHS[b.month]} ${b.year}`;
}

/** "1 Januari sampai 31 Oktober 2026" untuk label pembaca layar. */
export function formatPeriodLong(from, to) {
  const a = parts(from);
  const b = parts(to);
  const left =
    a.year === b.year
      ? `${a.day} ${MONTHS_LONG[a.month]}`
      : `${a.day} ${MONTHS_LONG[a.month]} ${a.year}`;
  return `${left} sampai ${b.day} ${MONTHS_LONG[b.month]} ${b.year}`;
}

/** Apakah tanggal ISO berada dalam rentang `from`–`to` (YYYY-MM-DD, inklusif). */
export function inPeriod(iso, from, to) {
  const day = new Date(new Date(iso).getTime() + 7 * 3600000).toISOString().slice(0, 10);
  return day >= from && day <= to;
}

/** "4,9" */
export const formatScore = (value) =>
  value == null ? '–' : value.toLocaleString('id-ID', { minimumFractionDigits: 1 });

/** Cocokkan nama kota dari sumber berbeda ("Kota Bandung" ↔ "Bandung"). */
export function sameCity(a, b) {
  const short = (v) => String(v).replace(/^(Kota|Kab\.|Kabupaten) /, '');
  return a === b || short(a) === short(b);
}

/* ——— Ekspor berkas ——— */

const BOM = String.fromCharCode(0xfeff);

const csvCell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV dengan BOM agar terbaca benar di Excel. */
export function toCsv(columns, rows) {
  return `${BOM}${[columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

const ascii = (text) =>
  String(text)
    .replace(/[–—]/g, '-')
    .replace(/·/g, '-')
    .replace(/→/g, '->')
    .replace(/…/g, '...')
    .normalize('NFD')
    .replace(/[^\x20-\x7E]/g, '');

const pdfText = (text) =>
  ascii(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/**
 * PDF teks sederhana (A4, Helvetica) tanpa pustaka tambahan.
 * `lines` = baris isi; baris yang diawali "# " dicetak sebagai subjudul.
 */
export function buildPdf(title, lines) {
  const items = [
    { text: title, size: 16 },
    { text: '', size: 10 },
    ...lines.map((line) =>
      line.startsWith('# ') ? { text: line.slice(2), size: 12 } : { text: line, size: 10 },
    ),
  ];
  const perPage = 50;
  const pages = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));

  const objects = [];
  const fontId = 3;
  const pageIds = pages.map((_, i) => 4 + i * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[fontId] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  pages.forEach((page, i) => {
    const pageId = pageIds[i];
    const stream = [
      'BT',
      '50 790 Td',
      '16 TL',
      ...page.map((item) => `/F1 ${item.size} Tf (${pdfText(item.text)}) Tj T*`),
      'ET',
    ].join('\n');
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1)
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

/**
 * Unduh berkas di browser. Mengembalikan `false` bila lingkungan tidak mendukung
 * (mis. saat test), agar pemanggil tetap bisa memberi umpan balik.
 */
export function downloadFile(filename, content, type) {
  if (typeof URL.createObjectURL !== 'function') return false;
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

/** Nama berkas aman: "Data Pesanan 1–30 Sep 2026" → "data-pesanan-1-30-sep-2026". */
export const slugFile = (text) =>
  ascii(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
