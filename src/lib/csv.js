const escapeCell = (value) => {
  const text = value == null ? '' : String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const BOM = String.fromCharCode(0xfeff);

/** Ubah array baris (array of array) menjadi teks CSV. */
export const toCsv = (rows) => rows.map((row) => row.map(escapeCell).join(',')).join('\n');

/** Unduh teks CSV sebagai file di browser (BOM agar Excel membaca UTF-8). */
export function downloadCsv(filename, rows) {
  const blob = new Blob([`${BOM}${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
